# Group-Based Permission System

## Overview

The file server now uses a **group-based permission system** where user permissions are determined entirely by their group memberships, rather than individual user-level settings.

## Key Changes

### Backend (`backend/auth.py`)

Added two new functions:

1. **`resolve_user_permissions(user)`**
   - Aggregates permissions from all groups a user belongs to
   - Uses **OR logic** for boolean permissions (if ANY group grants it, user has it)
   - Uses **MAX logic** for storage quota (largest quota wins, or unlimited if any group is unlimited)
   - Uses **UNION logic** for file types (user can upload any file type allowed by any of their groups)
   - Admins and super admins automatically get full permissions

2. **`check_permission(user, permission)`**
   - Validates if a user has a specific permission
   - Raises `HTTPException(403)` if permission is denied
   - Used as a guard in file operation endpoints

### Backend (`backend/main.py`)

Added permission checks to all file operation endpoints:

- **`upload_files`**: Checks `can_upload` + validates file types against `allowed_file_types`
- **`create_directory`**: Checks `can_create_folders`
- **`create_folder`**: Checks `can_create_folders`
- **`delete_file`**: Checks `can_delete`
- **`share_folder`**: Checks `can_share`

### Frontend (`frontend/src/components/Admin.jsx`)

Removed the obsolete "User Level" (read-only/read-write) controls:

- Removed "Access Level" dropdown from Create User form
- Removed "Level" column from user table
- Removed `editUserLevel` state variable
- Removed `user_level` from API payloads

## Permission Resolution Logic

### Boolean Permissions (OR Logic)

If a user belongs to multiple groups:
- `can_upload`: TRUE if ANY group allows upload
- `can_download`: TRUE if ANY group allows download
- `can_delete`: TRUE if ANY group allows delete
- `can_share`: TRUE if ANY group allows sharing
- `can_create_folders`: TRUE if ANY group allows folder creation

**Example:**
- User in "Readers" (can_upload=False) and "Writers" (can_upload=True)
- **Result**: User CAN upload (because Writers allows it)

### Storage Quota (MAX Logic)

- If ANY group has `max_storage_quota = None` (unlimited), user gets unlimited
- Otherwise, user gets the MAXIMUM quota from all their groups

**Example:**
- User in "Basic" (quota=1GB) and "Premium" (quota=10GB)
- **Result**: User gets 10GB quota

### File Types (UNION Logic)

- If ANY group has `allowed_file_types = None` (all types), user can upload any file
- Otherwise, user can upload the UNION of all allowed types from their groups

**Example:**
- User in "Images" (allowed=".jpg,.png") and "Documents" (allowed=".pdf,.docx")
- **Result**: User can upload .jpg, .png, .pdf, .docx

### Special Cases

**Users with NO groups:**
- All permissions set to FALSE
- Cannot perform any file operations (except viewing if they have access)

**Admin/Super Admin users:**
- Automatically get ALL permissions regardless of groups
- Unlimited storage quota
- Can upload any file type

## Migration Path

### Existing Users

The `user_level` field still exists in the database but is **no longer used** by the backend logic. Existing users will need to be assigned to appropriate groups to regain their permissions.

### Recommended Groups

Create these default groups for easy migration:

1. **"Readers"**
   - can_download: true
   - All other permissions: false

2. **"Writers"**
   - can_upload: true
   - can_download: true
   - can_create_folders: true
   - can_delete: false
   - can_share: false

3. **"Power Users"**
   - can_upload: true
   - can_download: true
   - can_create_folders: true
   - can_delete: true
   - can_share: true

### Migration Script Example

```python
# Assign users based on old user_level
for user in users:
    if user.user_level == 'read-only':
        assign_to_group(user, 'Readers')
    elif user.user_level == 'read-write':
        assign_to_group(user, 'Writers')
```

## API Changes

### User Creation/Update

The `user_level` field is now **optional and ignored**. Instead, specify groups:

```json
{
  "username": "john",
  "password": "secret",
  "root_path": "/",
  "groups": ["Writers", "Images"]
}
```

### Permission Errors

When a user lacks permission, they'll receive:

```json
{
  "detail": "Permission denied: can_upload required"
}
```

HTTP Status: **403 Forbidden**

## Testing Permissions

### Test Upload Permission

```bash
# User should be in a group with can_upload=true
curl -X POST http://localhost:30815/api/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@test.txt"
```

### Test Delete Permission

```bash
# User should be in a group with can_delete=true
curl -X DELETE http://localhost:30815/api/files/test.txt \
  -H "Authorization: Bearer $TOKEN"
```

### Test File Type Restriction

```bash
# If user's groups only allow .jpg,.png, uploading .pdf should fail
curl -X POST http://localhost:30815/api/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "files=@document.pdf"
# Expected: 403 Forbidden - "File type not allowed: .pdf"
```

## Benefits

1. **Centralized Control**: Change permissions for many users by updating one group
2. **Flexible**: Users can belong to multiple groups with different permissions
3. **Scalable**: Easy to add new permission types to groups
4. **Secure**: Permissions are enforced at the API level, not just UI
5. **Auditable**: Clear permission inheritance from groups

## Future Enhancements

- **Folder-level permissions**: Already supported in group model, needs enforcement
- **Time-based permissions**: Add expiration dates to group memberships
- **Permission inheritance**: Child folders inherit parent folder permissions
- **Audit logging**: Track who accessed what based on group permissions
