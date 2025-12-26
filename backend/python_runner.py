import os
import subprocess
import tempfile
import shutil
import asyncio
from pathlib import Path

class PythonRunner:
    def __init__(self):
        self.active_environments = {}
        # Check if docker is available
        try:
            subprocess.run(["docker", "--version"], check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
            self.docker_available = True
            print("[Python Runner] Docker is available. Sandboxing enabled.")
        except (subprocess.CalledProcessError, FileNotFoundError):
            self.docker_available = False
            print("[Python Runner] WARNING: Docker not found. Sandboxing disabled (or fallback needed).")

    async def create_environment(self, session_id: str):
        """Create a temporary environment (Docker container) for a session"""
        
        if not self.docker_available:
             raise RuntimeError("Docker is not available on the server. Cannot create sandbox.")

        # Create a temp directory on the HOST to mount into the container
        # This allows us to easily copy files in/out
        temp_dir = tempfile.mkdtemp(prefix=f"pysandbox_{session_id}_")
        
        container_name = f"sandbox_{session_id}"
        
        # Pull image if needed (async) or just assume it exists/will be pulled by run
        # Using python:3.9-slim for a balance of size and utility
        
        # Start the container
        # -d: detach
        # --rm: remove on exit
        # -v: mount temp dir to /app
        # -w: workdir /app
        # tail -f /dev/null: keep container alive
        cmd = [
            "docker", "run", "-d", "--rm",
            "--name", container_name,
            "-v", f"{temp_dir}:/app",
            "-w", "/app",
            "python:3.11-slim",
            "tail", "-f", "/dev/null"
        ]
        
        print(f"[Python Runner] Starting container: {' '.join(cmd)}")
        
        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        
        if process.returncode != 0:
            print(f"[Python Runner] Failed to start container: {stderr.decode()}")
            # Clean up temp dir
            shutil.rmtree(temp_dir)
            raise RuntimeError(f"Failed to start sandbox container: {stderr.decode()}")
            
        print(f"[Python Runner] Container started: {stdout.decode().strip()}")

        self.active_environments[session_id] = {
            "temp_dir": temp_dir,
            "container_name": container_name
        }
        
        return temp_dir

    async def run_python_file(self, session_id: str, file_content: str, file_name: str = "script.py", source_dir: str = None):
        """Run a Python file in the isolated environment"""
        if session_id not in self.active_environments:
            await self.create_environment(session_id)
        
        env_info = self.active_environments[session_id]
        temp_dir = env_info["temp_dir"]
        container_name = env_info["container_name"]

        # Copy files from source_dir to the temp_dir (which is mounted to /app)
        if source_dir and os.path.exists(source_dir):
            print(f"[Python Runner] Copying files from {source_dir} to {temp_dir}")
            try:
                items = os.listdir(source_dir)
                for item in items:
                    s = os.path.join(source_dir, item)
                    d = os.path.join(temp_dir, item)
                    if os.path.isdir(s):
                        if item in ["__pycache__", "venv", ".git"] or item.startswith("."):
                            continue
                        if not os.path.exists(d):
                            shutil.copytree(s, d)
                    else:
                        if item == file_name:
                            continue
                        shutil.copy2(s, d)
            except Exception as e:
                print(f"[Python Runner] Error copying files: {e}")
        
        # Write the Python file to temp directory
        script_path = os.path.join(temp_dir, file_name)
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(file_content)
        
        # Exec python in the container
        # We don't need venv path logic anymore, system python in container is fine
        cmd = [
            "docker", "exec",
            container_name,
            "python", file_name
        ]
        
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=30.0  # 30 second timeout
            )
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace"),
                "returncode": process.returncode
            }
        except asyncio.TimeoutError:
            return {
                "success": False,
                "stdout": "",
                "stderr": "Error: Script execution timed out (30 seconds)",
                "returncode": -1
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Error: {str(e)}",
                "returncode": -1
            }
    
    async def install_package(self, session_id: str, package_name: str):
        """Install a package in the isolated environment"""
        if session_id not in self.active_environments:
            await self.create_environment(session_id)
        
        env_info = self.active_environments[session_id]
        container_name = env_info["container_name"]
        
        try:
            cmd = [
                "docker", "exec",
                container_name,
                "pip", "install", package_name
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await asyncio.wait_for(
                process.communicate(),
                timeout=60.0  # 60 second timeout for package installation
            )
            
            return {
                "success": process.returncode == 0,
                "stdout": stdout.decode("utf-8", errors="replace"),
                "stderr": stderr.decode("utf-8", errors="replace")
            }
        except Exception as e:
            return {
                "success": False,
                "stdout": "",
                "stderr": f"Error: {str(e)}"
            }
    
    def cleanup_environment(self, session_id: str):
        """Clean up the temporary environment"""
        if session_id in self.active_environments:
            env_info = self.active_environments[session_id]
            temp_dir = env_info["temp_dir"]
            container_name = env_info["container_name"]
            
            try:
                # Stop/Remove container
                print(f"[Python Runner] Removing container {container_name}")
                subprocess.run(["docker", "rm", "-f", container_name], 
                             check=False, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                
                # Remove temp dir
                print(f"[Python Runner] Removing temp dir {temp_dir}")
                shutil.rmtree(temp_dir)
            except Exception as e:
                print(f"Error cleaning up environment {session_id}: {e}")
            
            del self.active_environments[session_id]
    
    def cleanup_all(self):
        """Clean up all active environments"""
        for session_id in list(self.active_environments.keys()):
            self.cleanup_environment(session_id)

# Global runner instance
runner = PythonRunner()
