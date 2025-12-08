"""
Server Configuration Management
Handles reading and writing server configuration
"""
import os
import json
from pathlib import Path
from typing import Dict, Any

CONFIG_FILE = "server_config.json"

DEFAULT_CONFIG = {
    "port": 30815,
    "host": "0.0.0.0",
    "max_file_size_mb": 500,
    "max_total_upload_size_mb": 1000,
    "allow_registration": False,
    "session_timeout_minutes": 60,
    "enable_python_execution": True,
    "enable_collaboration": True,
}

def get_config_path() -> Path:
    """Get the path to the configuration file"""
    # Store config in the same directory as the executable/script
    base_path = Path(__file__).parent.parent
    return base_path / CONFIG_FILE

def load_config() -> Dict[str, Any]:
    """Load configuration from file, or return defaults if file doesn't exist"""
    config_path = get_config_path()
    
    if config_path.exists():
        try:
            with open(config_path, 'r') as f:
                config = json.load(f)
                # Merge with defaults to ensure all keys exist
                return {**DEFAULT_CONFIG, **config}
        except Exception as e:
            print(f"Error loading config: {e}")
            return DEFAULT_CONFIG.copy()
    
    return DEFAULT_CONFIG.copy()

def save_config(config: Dict[str, Any]) -> bool:
    """Save configuration to file"""
    config_path = get_config_path()
    
    try:
        # Validate config values
        validated_config = validate_config(config)
        
        with open(config_path, 'w') as f:
            json.dump(validated_config, f, indent=2)
        
        print(f"Configuration saved to {config_path}")
        return True
    except Exception as e:
        print(f"Error saving config: {e}")
        return False

def validate_config(config: Dict[str, Any]) -> Dict[str, Any]:
    """Validate and sanitize configuration values"""
    validated = {}
    
    # Port must be between 1024 and 65535
    validated['port'] = max(1024, min(65535, int(config.get('port', DEFAULT_CONFIG['port']))))
    
    # Host must be a valid string
    validated['host'] = str(config.get('host', DEFAULT_CONFIG['host']))
    
    # File sizes must be positive integers
    validated['max_file_size_mb'] = max(1, int(config.get('max_file_size_mb', DEFAULT_CONFIG['max_file_size_mb'])))
    validated['max_total_upload_size_mb'] = max(1, int(config.get('max_total_upload_size_mb', DEFAULT_CONFIG['max_total_upload_size_mb'])))
    
    # Boolean values
    validated['allow_registration'] = bool(config.get('allow_registration', DEFAULT_CONFIG['allow_registration']))
    validated['enable_python_execution'] = bool(config.get('enable_python_execution', DEFAULT_CONFIG['enable_python_execution']))
    validated['enable_collaboration'] = bool(config.get('enable_collaboration', DEFAULT_CONFIG['enable_collaboration']))
    
    # Session timeout must be positive
    validated['session_timeout_minutes'] = max(5, int(config.get('session_timeout_minutes', DEFAULT_CONFIG['session_timeout_minutes'])))
    
    return validated

def get_config_value(key: str, default: Any = None) -> Any:
    """Get a specific configuration value"""
    config = load_config()
    return config.get(key, default)

def update_config_value(key: str, value: Any) -> bool:
    """Update a specific configuration value"""
    config = load_config()
    config[key] = value
    return save_config(config)
