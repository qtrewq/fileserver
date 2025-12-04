# Admin Groups Migration Summary

## What Was Done

Successfully migrated admin permissions from user flags to group-based system.

## Changes Made

### 1. Created Admin Groups

Two new groups were created with full permissions:

**`admins` group:**
- Description: "Administrators with full file management permissions"
- Permissions: All file operations enabled (upload, download, delete, share, create folders)
- Storage: Unlimited quota
- File types: All types allowed

**`super_admins` group:**
- Description: "Super Administrators with full system access including user management"
- Permissions: All file operations enabled (upload, download, delete, share, create folders)
- Storage: Unlimited quota
- File types: All types allowed

### 2. Migrated Users

All existing admin users were automatically assigned to their respective groups:

- **Super Admin users** → Added to `super_admins` group
- **Regular Admin users** → Added to `admins` group

**Migration Results:**
- `admins` group: 0 members
- `super_admins` group: 3 members (aqueous, admin2, admin)

### 3. Updated Permission Logic

Modified `backend/auth.py` to check BOTH:
1. User flags (`is_admin`, `is_super_admin`)
2. Group membership (`admins`, `super_admins` groups)

**Logic:**
```python
# User is considered admin if:
# - They have is_admin=True OR is_super_admin=True flag
# - OR they belong to 'admins' or 'super_admins' group
```

This dual-check approach ensures:
- ✅ Backward compatibility with existing admin flags
- ✅ Forward compatibility with group-based permissions
- ✅ Flexibility to remove flags in the future

## How It Works Now

### For File Operations

When a user tries to upload/delete/share files:

1. **Check admin status:**
   - If user has `is_admin` or `is_super_admin` flag → Full permissions
   - If user is in `admins` or `super_admins` group → Full permissions
   - Otherwise → Check group permissions

2. **Aggregate group permissions:**
   - Collect permissions from ALL user's groups
   - Use OR logic for boolean permissions
   - Use MAX for storage quota
   - Use UNION for file types

### For Admin Panel Access

The Admin panel still checks `is_admin` and `is_super_admin` flags in `backend/main.py`:

```python
@app.get("/api/users")
def read_users(..., current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
```

**Note:** Admin panel access is NOT yet group-based. This could be updated in the future to also check for group membership.

## Benefits

### 1. Centralized Management
- Change admin permissions by updating the `admins` or `super_admins` group
- No need to modify individual user flags

### 2. Flexible Hierarchy
- Can create different admin levels (e.g., "moderators", "power_admins")
- Users can have multiple admin roles

### 3. Audit Trail
- Group membership provides clear permission inheritance
- Easy to see who has admin access by checking group members

### 4. Gradual Migration
- Old `is_admin` flags still work
- Can gradually transition to pure group-based system
- No breaking changes for existing users

## Future Enhancements

### Optional: Remove Admin Flags

Once you're confident in the group-based system, you can:

1. **Update Admin Panel checks** to use groups:
```python
def is_admin_user(user):
    return user.is_admin or user.is_super_admin or \
           any(g.name in ['admins', 'super_admins'] for g in user.groups)
```

2. **Remove flags from database** (optional):
```python
# Migration to remove is_admin and is_super_admin columns
# Only do this after updating all admin checks to use groups
```

### Recommended: Create More Admin Levels

```python
# Example: Moderator group (limited admin)
moderators = Group(
    name="moderators",
    description="Moderators with user management but limited file access",
    can_upload=True,
    can_download=True,
    can_delete=False,  # Cannot delete
    can_share=True,
    can_create_folders=True,
    max_storage_quota=10 * 1024 * 1024 * 1024,  # 10GB limit
    allowed_file_types=None
)
```

## Testing

### Verify Admin Permissions

1. **Test file upload** as admin user:
```bash
curl -X POST http://localhost:30815/api/upload/ \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "files=@test.txt"
# Should succeed
```

2. **Test admin panel access**:
```bash
curl http://localhost:30815/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN"
# Should return user list
```

3. **Test non-admin with no groups**:
```bash
curl -X POST http://localhost:30815/api/upload/ \
  -H "Authorization: Bearer $USER_TOKEN" \
  -F "files=@test.txt"
# Should fail with 403: Permission denied: can_upload required
```

## Files Modified

- `backend/auth.py` - Updated `resolve_user_permissions()` to check group membership
- `migrate_admin_to_groups.py` - New migration script (can be run multiple times safely)

## Migration Script

The migration script is **idempotent** - safe to run multiple times:
- Won't create duplicate groups
- Won't duplicate group memberships
- Can be used to add new admins to groups

To run:
```bash
python migrate_admin_to_groups.py
```

---

**Status:** ✅ Complete - Admin permissions now work via both flags AND groups!
