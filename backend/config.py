"""
Server configuration management module
Handles reading and writing server configuration settings
"""

import os
import json
from typing import Dict, Any, Optional
from pathlib import Path

# Default configuration
DEFAULT_CONFIG = {
    "server": {
        "port": 30815,
        "host": "0.0.0.0",
        "public_url": "http://localhost:30815",
        "reload": False,
    },
    "security": {
        "max_file_size_mb": 100,
        "max_total_upload_size_mb": 500,
        "allowed_origins": "*",
        "session_timeout_minutes": 480,  # 8 hours
    },
    "storage": {
        "root_path": "./storage",
    },
    "features": {
        "enable_file_sharing": True,
        "enable_collaborative_editing": True,
        "enable_python_execution": True,
    },
    "limits": {
        "max_users": 1000,
        "max_groups": 100,
        "max_concurrent_connections": 100,
    },
    "smtp": {
        "enabled": False,
        "mode": "relay",
        "host": "smtp.example.com",
        "port": 587,
        "username": "user@example.com",
        "password": "password",
        "from_email": "noreply@aqueous.lol",
        "use_tls": True
    }
}

class ServerConfig:
    def __init__(self, config_file: str = "server_config.json"):
        self.config_file = config_file
        self.config = self._load_config()
    
    def _load_config(self) -> Dict[str, Any]:
        """Load configuration from file or create with defaults"""
        if os.path.exists(self.config_file):
            try:
                with open(self.config_file, 'r') as f:
                    loaded_config = json.load(f)
                # Merge with defaults to ensure all keys exist
                return self._merge_configs(DEFAULT_CONFIG, loaded_config)
            except Exception as e:
                print(f"Error loading config file: {e}")
                print("Using default configuration")
                return DEFAULT_CONFIG.copy()
        else:
            # Create config file with defaults
            self._save_config(DEFAULT_CONFIG)
            return DEFAULT_CONFIG.copy()
    
    def _merge_configs(self, default: Dict, loaded: Dict) -> Dict:
        """Recursively merge loaded config with defaults"""
        result = default.copy()
        for key, value in loaded.items():
            if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                result[key] = self._merge_configs(result[key], value)
            else:
                result[key] = value
        return result
    
    def _save_config(self, config: Dict[str, Any]) -> bool:
        """Save configuration to file"""
        try:
            with open(self.config_file, 'w') as f:
                json.dump(config, f, indent=2)
            return True
        except Exception as e:
            print(f"Error saving config file: {e}")
            return False
    
    def get(self, section: str, key: str, default: Any = None) -> Any:
        """Get a configuration value"""
        try:
            return self.config.get(section, {}).get(key, default)
        except:
            return default
    
    def get_section(self, section: str) -> Dict[str, Any]:
        """Get an entire configuration section"""
        return self.config.get(section, {}).copy()
    
    def get_all(self) -> Dict[str, Any]:
        """Get all configuration"""
        return self.config.copy()
    
    def set(self, section: str, key: str, value: Any) -> bool:
        """Set a configuration value"""
        if section not in self.config:
            self.config[section] = {}
        self.config[section][key] = value
        return self._save_config(self.config)
    
    def update_section(self, section: str, values: Dict[str, Any]) -> bool:
        """Update multiple values in a section"""
        if section not in self.config:
            self.config[section] = {}
        self.config[section].update(values)
        return self._save_config(self.config)
    
    def update_all(self, new_config: Dict[str, Any]) -> bool:
        """Update entire configuration"""
        # Merge with defaults to ensure structure
        self.config = self._merge_configs(DEFAULT_CONFIG, new_config)
        return self._save_config(self.config)
    
    def reset_to_defaults(self) -> bool:
        """Reset configuration to defaults"""
        self.config = DEFAULT_CONFIG.copy()
        return self._save_config(self.config)
    
    def validate_config(self, config: Dict[str, Any]) -> tuple[bool, Optional[str]]:
        """Validate configuration values"""
        try:
            # Validate server settings
            if "server" in config:
                port = config["server"].get("port")
                if port and (not isinstance(port, int) or port < 1 or port > 65535):
                    return False, "Port must be between 1 and 65535"
            
            # Validate security settings
            if "security" in config:
                max_file_size = config["security"].get("max_file_size_mb")
                if max_file_size and (not isinstance(max_file_size, (int, float)) or max_file_size <= 0):
                    return False, "Max file size must be a positive number"
                
                max_total_size = config["security"].get("max_total_upload_size_mb")
                if max_total_size and (not isinstance(max_total_size, (int, float)) or max_total_size <= 0):
                    return False, "Max total upload size must be a positive number"
                
                timeout = config["security"].get("session_timeout_minutes")
                if timeout and (not isinstance(timeout, (int, float)) or timeout <= 0):
                    return False, "Session timeout must be a positive number"
            
            # Validate limits
            if "limits" in config:
                for key in ["max_users", "max_groups", "max_concurrent_connections"]:
                    value = config["limits"].get(key)
                    if value and (not isinstance(value, int) or value <= 0):
                        return False, f"{key} must be a positive integer"
            
            return True, None
        except Exception as e:
            return False, f"Validation error: {str(e)}"

# Global configuration instance
_config_instance = None

def get_config() -> ServerConfig:
    """Get the global configuration instance"""
    global _config_instance
    if _config_instance is None:
        _config_instance = ServerConfig()
    return _config_instance

def reload_config():
    """Reload configuration from file"""
    global _config_instance
    _config_instance = ServerConfig()
    return _config_instance
