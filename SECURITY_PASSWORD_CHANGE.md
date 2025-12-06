# FileServer - Security Enhancement: Forced Password Change

## ✅ Implemented

The default admin account now requires a password change on first login for enhanced security.

### What Was Changed

**Backend** (`backend/main.py`):
- Updated the admin user creation in `startup_event()`
- Added `require_password_change=True` flag
- Added console warnings when the default admin user is created

### How It Works

1. **First Installation**:
   - When FileServer starts for the first time
   - Creates admin user with default credentials
   - Sets `require_password_change=True`
   - Prints warning to console

2. **First Login**:
   - User logs in with `admin` / `adminpassword`
   - Frontend detects `require_password_change` flag
   - Automatically shows password change dialog
   - User MUST change password to continue

3. **After Password Change**:
   - Flag is cleared (`require_password_change=False`)
   - User can access the application normally
   - New password is required for future logins

### Default Credentials

**Username**: `admin`
**Password**: `adminpassword`

⚠️ **IMPORTANT**: These credentials MUST be changed on first login!

### Security Benefits

- ✅ Prevents use of default credentials in production
- ✅ Forces administrators to set secure passwords
- ✅ Reduces risk of unauthorized access
- ✅ Follows security best practices
- ✅ Automatic enforcement (no manual steps required)

### User Experience

**On First Login**:
1. Enter default credentials (`admin` / `adminpassword`)
2. Password change dialog appears automatically
3. Enter new secure password
4. Password is changed and flag is cleared
5. User is logged in with new credentials

**Subsequent Logins**:
- Use new password
- No password change required
- Normal application access

### For Installers

The installer creates a fresh database, so:
- ✅ Every new installation requires password change
- ✅ Upgrades preserve existing passwords
- ✅ No manual configuration needed
- ✅ Works automatically

### Console Output

When the default admin user is created:
```
Created default admin user (username: admin, password: adminpassword)
IMPORTANT: You must change the admin password on first login!
```

### Technical Details

**Database Field**: `User.require_password_change` (Boolean)
- `True`: User must change password
- `False`: Normal login allowed

**Password Change Endpoint**: `/api/users/me/password`
- Automatically clears the flag when password is changed
- Validates current password (if not admin reset)
- Hashes new password securely

**Frontend Handling**: `Dashboard.jsx`
- Checks `user.require_password_change` on login
- Shows password change modal automatically
- Prevents access until password is changed

### Backward Compatibility

- ✅ Existing installations: Admin user already exists, no change required
- ✅ New installations: Automatic password change enforcement
- ✅ Database migration: Not required (field already exists)
- ✅ Frontend: Already supports the feature

### Testing

To test the feature:
1. Delete `fileserver.db` (or use fresh installation)
2. Start FileServer
3. Login with `admin` / `adminpassword`
4. Verify password change dialog appears
5. Change password
6. Verify normal access after change

### Documentation Updates

Users should be informed:
- Default credentials in README
- Password change requirement
- Security best practices
- How to reset if forgotten

## Summary

The default admin account now enforces a password change on first login, significantly improving the security posture of new FileServer installations. This is a zero-configuration security enhancement that protects users automatically.
