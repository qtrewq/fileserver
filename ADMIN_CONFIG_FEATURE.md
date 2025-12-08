# FileServer - Admin Server Configuration Feature

## Overview
This document outlines the implementation plan for allowing admins to configure server settings from the admin panel.

## Features to Implement

### 1. Server Configuration Management

**Backend** (`backend/config.py` - CREATED ✅):
- Configuration file management (JSON-based)
- Default configuration values
- Configuration validation
- Get/Set configuration values

**Configurable Settings**:
- `port` - Server port (default: 30815)
- `host` - Server host (default: 0.0.0.0)
- `max_file_size_mb` - Maximum file size (default: 500MB)
- `max_total_upload_size_mb` - Maximum total upload size (default: 1000MB)
- `allow_registration` - Allow user registration (default: false)
- `session_timeout_minutes` - Session timeout (default: 60)
- `enable_python_execution` - Enable Python code execution (default: true)
- `enable_collaboration` - Enable real-time collaboration (default: true)

### 2. API Endpoints (TODO)

Add to `backend/main.py`:

```python
# Import config module
from . import config as server_config

# GET /api/server/config - Get current configuration (super admin only)
@app.get("/api/server/config")
def get_server_config(current_user: models.User = Depends(get_current_user)):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    return server_config.load_config()

# PUT /api/server/config - Update configuration (super admin only)
@app.put("/api/server/config")
def update_server_config(config_data: dict, current_user: models.User = Depends(get_current_user)):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    success = server_config.save_config(config_data)
    if success:
        return {
            "status": "success",
            "message": "Configuration saved. Server restart required.",
            "requires_restart": True
        }
    raise HTTPException(status_code=500, detail="Failed to save configuration")

# POST /api/server/restart - Request server restart (super admin only)
@app.post("/api/server/restart")
def restart_server(current_user: models.User = Depends(get_current_user)):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    return {
        "status": "info",
        "message": "Please manually restart the server.",
        "instructions": "Stop the server (Ctrl+C) and start it again."
    }
```

### 3. Frontend Admin Panel (TODO)

Add to Dashboard.jsx - Server Settings Tab:

**UI Components**:
- Server Configuration Form
  - Port number input
  - Host input
  - File size limits
  - Feature toggles (Python execution, collaboration, etc.)
- Save Configuration button
- Restart Server button
- Status messages

**Features**:
- Load current configuration on mount
- Validate inputs before saving
- Show success/error messages
- Display restart requirement notice

### 4. Login Error Message Fix (TODO)

**Issue**: Error message flashes briefly and disappears

**Solution** in `frontend/src/components/Login.jsx`:
- Error state is already properly managed
- Issue might be with error clearing timing
- Ensure error persists until user takes action
- Add minimum display time for error messages

**Current Code** (lines 13-50):
```javascript
const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');  // Clear previous errors

    try {
        // ... login logic ...
        navigate('/');  // Only navigates on SUCCESS
    } catch (err) {
        // Error handling - sets error state
        setError(err.response?.data?.detail || 'Invalid credentials');
        // Error should persist here
    } finally {
        setLoading(false);
    }
};
```

**Potential Fix**:
- Error already persists correctly in code
- May be a browser/React rendering issue
- Consider adding a small delay before navigation on success
- Or add animation to make error more visible

## Implementation Steps

### Phase 1: Backend (In Progress)
1. ✅ Create `backend/config.py` module
2. ⏳ Add API endpoints to `backend/main.py`
3. ⏳ Test configuration save/load
4. ⏳ Integrate with launcher.py to read config on startup

### Phase 2: Frontend
1. ⏳ Create Server Settings component
2. ⏳ Add to Admin panel navigation
3. ⏳ Implement configuration form
4. ⏳ Add API calls for get/update config
5. ⏳ Add restart instructions modal

### Phase 3: Testing
1. ⏳ Test configuration persistence
2. ⏳ Test validation
3. ⏳ Test server restart with new config
4. ⏳ Test permissions (super admin only)

### Phase 4: Login Fix
1. ⏳ Investigate error message timing
2. ⏳ Implement fix if needed
3. ⏳ Test across different browsers

## Files Created/Modified

**Created**:
- `backend/config.py` - Configuration management module

**To Modify**:
- `backend/main.py` - Add API endpoints
- `launcher.py` - Read config on startup
- `frontend/src/components/Dashboard.jsx` - Add server settings UI
- `frontend/src/components/Login.jsx` - Fix error message (if needed)

## Configuration File Location

- Development: `./server_config.json`
- Production: Same directory as executable

## Security Considerations

- ✅ Only super admins can view/modify configuration
- ✅ Configuration validation prevents invalid values
- ✅ Port range restricted (1024-65535)
- ✅ File sizes must be positive integers
- ⚠️ Manual restart required (no automatic restart for security)

## Next Steps

1. Add API endpoints to main.py (carefully, avoiding file corruption)
2. Create frontend Server Settings component
3. Test configuration management
4. Investigate and fix login error message issue
5. Document for users

## Notes

- Server restart is MANUAL for security reasons
- Configuration changes take effect after restart
- Invalid configurations are rejected with validation errors
- Default configuration is always available as fallback
