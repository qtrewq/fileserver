import os
import subprocess
import tempfile
import shutil
import asyncio
from pathlib import Path

class PythonRunner:
    def __init__(self):
        self.active_environments = {}
    
    async def create_environment(self, session_id: str):
        """Create a temporary virtual environment for a session"""
        temp_dir = tempfile.mkdtemp(prefix=f"pyenv_{session_id}_")
        venv_path = os.path.join(temp_dir, "venv")
        
        # Create virtual environment
        process = await asyncio.create_subprocess_exec(
            "python", "-m", "venv", venv_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        await process.communicate()
        
        self.active_environments[session_id] = {
            "temp_dir": temp_dir,
            "venv_path": venv_path
        }
        
        return temp_dir, venv_path
    
    async def run_python_file(self, session_id: str, file_content: str, file_name: str = "script.py", source_dir: str = None):
        """Run a Python file in the isolated environment"""
        if session_id not in self.active_environments:
            await self.create_environment(session_id)
        
        env_info = self.active_environments[session_id]
        temp_dir = env_info["temp_dir"]
        venv_path = env_info["venv_path"]

        # Copy files from source_dir if provided
        if source_dir and os.path.exists(source_dir):
            print(f"[Python Runner] Copying files from {source_dir} to {temp_dir}")
            try:
                items = os.listdir(source_dir)
                print(f"[Python Runner] Found {len(items)} items in source directory: {items}")
                
                for item in items:
                    s = os.path.join(source_dir, item)
                    d = os.path.join(temp_dir, item)
                    if os.path.isdir(s):
                        # Skip __pycache__, venv, and hidden directories
                        if item in ["__pycache__", "venv", ".git"] or item.startswith("."):
                            print(f"[Python Runner] Skipping directory: {item}")
                            continue
                        # Copy directory if it doesn't exist
                        if not os.path.exists(d):
                            print(f"[Python Runner] Copying directory: {item}")
                            shutil.copytree(s, d)
                        else:
                            print(f"[Python Runner] Directory already exists: {item}")
                    else:
                        # Skip the script itself (we write it from content)
                        if item == file_name:
                            print(f"[Python Runner] Skipping script file (will write from content): {item}")
                            continue
                        # Copy file
                        print(f"[Python Runner] Copying file: {item}")
                        shutil.copy2(s, d)
                
                # List files in temp_dir after copying
                copied_files = os.listdir(temp_dir)
                print(f"[Python Runner] Files in temp directory after copying: {copied_files}")
            except Exception as e:
                print(f"[Python Runner] Error copying files from {source_dir}: {e}")
                import traceback
                traceback.print_exc()
        else:
            if source_dir:
                print(f"[Python Runner] Source directory does not exist: {source_dir}")
            else:
                print(f"[Python Runner] No source directory provided")
        
        # Write the Python file to temp directory
        script_path = os.path.join(temp_dir, file_name)
        with open(script_path, "w", encoding="utf-8") as f:
            f.write(file_content)
        
        # Determine Python executable in venv
        if os.name == 'nt':  # Windows
            python_exe = os.path.join(venv_path, "Scripts", "python.exe")
        else:  # Unix/Linux/Mac
            python_exe = os.path.join(venv_path, "bin", "python")
        
        # Run the script
        try:
            process = await asyncio.create_subprocess_exec(
                python_exe, script_path,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=temp_dir
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
        venv_path = env_info["venv_path"]
        
        # Determine pip executable in venv
        if os.name == 'nt':  # Windows
            pip_exe = os.path.join(venv_path, "Scripts", "pip.exe")
        else:  # Unix/Linux/Mac
            pip_exe = os.path.join(venv_path, "bin", "pip")
        
        try:
            process = await asyncio.create_subprocess_exec(
                pip_exe, "install", package_name,
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
            
            try:
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
