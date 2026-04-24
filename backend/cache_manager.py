import os
import shutil
import hashlib
from datetime import datetime
from pathlib import Path
import threading
import time

class CacheManager:
    def __init__(self, cache_path, max_size_gb, enabled=False):
        self.enabled = enabled
        self.cache_path = os.path.abspath(cache_path)
        self.max_size_bytes = max_size_gb * 1024 * 1024 * 1024
        self.lock = threading.Lock()
        
        if self.enabled:
            if not os.path.exists(self.cache_path):
                try:
                    os.makedirs(self.cache_path, exist_ok=True)
                except Exception as e:
                    print(f"Error creating cache directory {self.cache_path}: {e}")
                    self.enabled = False

    def _get_cache_key(self, file_path):
        """Generate a unique filename for the cache based on the absolute path."""
        abs_path = os.path.abspath(file_path)
        return hashlib.sha256(abs_path.encode()).hexdigest()

    def get_cached_path(self, original_path):
        """Return the path to the cached version of the file if it exists and is up to date."""
        if not self.enabled or not os.path.isfile(original_path):
            return None
            
        cache_key = self._get_cache_key(original_path)
        cached_file = os.path.join(self.cache_path, cache_key)
        
        if os.path.exists(cached_file):
            try:
                # Check if original is newer than cached
                if os.path.getmtime(original_path) <= os.path.getmtime(cached_file):
                    # Update access time for LRU (on Unix-like systems)
                    # On Windows, access time might not be updated as frequently depending on settings
                    try:
                        os.utime(cached_file, None)
                    except:
                        pass
                    return cached_file
            except:
                pass
        
        # If file not in cache, trigger background caching
        self.cache_file(original_path)
        return None

    def cache_file(self, original_path):
        """Copy a file to the cache in the background."""
        if not self.enabled or not os.path.isfile(original_path):
            return
            
        file_size = os.path.getsize(original_path)
        if file_size > self.max_size_bytes or file_size > 2 * 1024 * 1024 * 1024: # Don't cache files > 2GB by default
            return

        cache_key = self._get_cache_key(original_path)
        cached_file = os.path.join(self.cache_path, cache_key)
        
        # Don't start another thread if already zipping/caching this file
        # Simple check: if temp file exists, someone is already caching it
        if os.path.exists(cached_file + ".tmp"):
            return
        if os.path.exists(cached_file) and os.path.getmtime(original_path) <= os.path.getmtime(cached_file):
            return

        def _do_cache():
            # Check again inside thread
            if os.path.exists(cached_file + ".tmp"):
                return
                
            temp_file = cached_file + ".tmp"
            try:
                with self.lock:
                    self._ensure_space(file_size)
                
                # Copy outside lock to not block others
                shutil.copy2(original_path, temp_file)
                
                with self.lock:
                    if os.path.exists(cached_file):
                        os.remove(cached_file)
                    os.rename(temp_file, cached_file)
                    print(f"[CACHE] Cached: {original_path}")
            except Exception as e:
                print(f"[CACHE] Error caching {original_path}: {e}")
                if os.path.exists(temp_file):
                    try: os.remove(temp_file)
                    except: pass

        thread = threading.Thread(target=_do_cache, daemon=True)
        thread.start()

    def _ensure_space(self, needed_bytes):
        """Evict oldest files if cache is full."""
        current_size = self._get_total_size()
        if current_size + needed_bytes <= self.max_size_bytes:
            return

        # Find all files with their access times
        files = []
        for entry in os.scandir(self.cache_path):
            if entry.is_file() and not entry.name.endswith(".tmp"):
                files.append((entry.path, entry.stat().st_size, entry.stat().st_atime))
        
        # Sort by access time (oldest first)
        files.sort(key=lambda x: x[2])
        
        for path, size, atime in files:
            if current_size + needed_bytes <= self.max_size_bytes:
                break
            try:
                os.remove(path)
                current_size -= size
                print(f"[CACHE] Evicted: {path}")
            except:
                pass

    def _get_total_size(self):
        total = 0
        try:
            for entry in os.scandir(self.cache_path):
                if entry.is_file():
                    total += entry.stat().st_size
        except:
            pass
        return total

    def clear_cache(self):
        with self.lock:
            for entry in os.scandir(self.cache_path):
                if entry.is_file():
                    try: os.remove(entry.path)
                    except: pass
