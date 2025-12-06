# FileServer - Authorization Fix & Rebuild

## ✅ Issue Fixed

**Problem**: On new installations, the admin user received "not authorized" errors when trying to access admin settings.

**Root Cause**: The `is_super_admin()` function only checked for group membership in a 'super_admins' group, but the default admin user was created with the `is_super_admin` database flag set without being added to any group.

## Solution

Updated the `is_super_admin()` function in `backend/main.py` to check BOTH:
1. The `user.is_super_admin` database flag (primary check)
2. Group membership in 'super_admins' group (backward compatibility)

### Code Change

**Before**:
```python
def is_super_admin(user: models.User) -> bool:
    """Check if user is a super admin based on group membership."""
    if not user or not user.groups:
        return False
    return any(g.name == 'super_admins' for g in user.groups)
```

**After**:
```python
def is_super_admin(user: models.User) -> bool:
    """Check if user is a super admin based on database flag or group membership."""
    if not user:
        return False
    # Check database flag first
    if user.is_super_admin:
        return True
    # Also check group membership for backward compatibility
    if user.groups:
        return any(g.name == 'super_admins' for g in user.groups)
    return False
```

## What Was Done

1. ✅ Fixed `is_super_admin()` function
2. ✅ Committed changes to GitHub
3. ✅ Rebuilt executable (`FileServer.exe`)
4. ✅ Tested build (successful)

## Executable Details

- **File**: `dist/FileServer.exe`
- **Size**: ~28.6 MB
- **Status**: Ready for distribution
- **Changes**: Includes authorization fix

## Testing

To verify the fix:
1. Delete any existing `fileserver.db`
2. Run `FileServer.exe`
3. Login with `admin` / `adminpassword`
4. Change password when prompted
5. Access Admin panel
6. Verify no "not authorized" errors

## What Works Now

- ✅ Default admin user has full super admin access
- ✅ Can access all admin settings
- ✅ Can create/modify users
- ✅ Can create/modify groups
- ✅ Can manage permissions
- ✅ Password change required on first login
- ✅ All authorization checks pass

## Backward Compatibility

The fix maintains backward compatibility:
- ✅ Users with `is_super_admin` flag: Work correctly
- ✅ Users in 'super_admins' group: Still work
- ✅ Existing installations: No impact
- ✅ New installations: Work correctly

## Next Steps

### To Build Installer (Optional):

If you have Inno Setup installed:
```bash
build_installer.bat
```

The installer will be created in `installer_output/FileServer-Setup-1.0.0.exe`

### To Distribute:

**Option 1**: Standalone Executable
- File: `dist/FileServer.exe`
- Just share the .exe file

**Option 2**: Professional Installer
- File: `installer_output/FileServer-Setup-1.0.0.exe` (after building)
- Full installation experience with shortcuts

## Commits

- `b6d802c` - Fix is_super_admin to check database flag for authorization

## Summary

The authorization issue has been fixed and the executable has been rebuilt. The default admin user now has full super admin access on new installations, and all admin functionality works correctly.
