"""
Documentation for Enhanced Group Permission System

This system allows administrators to create groups with fine-grained permissions
and folder-level access controls.

## Permission Types

### Default Permission Levels:
- **none**: No access to files/folders
- **read**: Can view and download files
- **write**: Can upload, modify, and delete files
- **admin**: Full access including sharing

### Granular Permissions:
- **can_upload**: Allow uploading new files
- **can_download**: Allow downloading files
- **can_delete**: Allow deleting files/folders
- **can_share**: Allow sharing files with other users
- **can_create_folders**: Allow creating new folders

### Folder Access Control:
- **restrict_to_folders**: When enabled, users can only access specified folders
- **folder_permissions**: List of folder paths with specific permissions

## Usage Examples

### Example 1: Read-Only Group
```json
{
  "name": "viewers",
  "description": "Read-only access to all files",
  "default_permission": "read",
  "can_upload": false,
  "can_download": true,
  "can_delete": false,
  "can_share": false,
  "can_create_folders": false,
  "restrict_to_folders": false
}
```

### Example 2: Project Team with Folder Restrictions
```json
{
  "name": "project_alpha",
  "description": "Project Alpha team members",
  "default_permission": "write",
  "can_upload": true,
  "can_download": true,
  "can_delete": true,
  "can_share": true,
  "can_create_folders": true,
  "restrict_to_folders": true,
  "folder_permissions": [
    {
      "folder_path": "/projects/alpha",
      "permission": "write"
    },
    {
      "folder_path": "/shared/resources",
      "permission": "read"
    }
  ]
}
```

### Example 3: Department with Mixed Access
```json
{
  "name": "sales_dept",
  "description": "Sales department",
  "default_permission": "read",
  "can_upload": true,
  "can_download": true,
  "can_delete": false,
  "can_share": true,
  "can_create_folders": true,
  "restrict_to_folders": true,
  "folder_permissions": [
    {
      "folder_path": "/sales",
      "permission": "write"
    },
    {
      "folder_path": "/marketing",
      "permission": "read"
    },
    {
      "folder_path": "/company/policies",
      "permission": "read"
    }
  ]
}
```

## API Endpoints

### Create Group with Permissions
```
POST /api/groups/
Content-Type: application/json

{
  "name": "group_name",
  "description": "Group description",
  "default_permission": "read",
  "can_upload": true,
  "can_download": true,
  "can_delete": false,
  "can_share": false,
  "can_create_folders": true,
  "restrict_to_folders": true,
  "folder_permissions": [
    {
      "folder_path": "/path/to/folder",
      "permission": "write"
    }
  ]
}
```

### Update Group Permissions
```
PUT /api/groups/{group_name}/
Content-Type: application/json

{
  "description": "Updated description",
  "default_permission": "write",
  "can_delete": true,
  "folder_permissions": [
    {
      "folder_path": "/new/path",
      "permission": "read"
    }
  ]
}
```

### Get Group Details
```
GET /api/groups/{group_name}/
```

### List All Groups
```
GET /api/groups/
```

### Delete Group
```
DELETE /api/groups/{group_name}/
```

## Permission Hierarchy

When determining access, the system checks permissions in this order:

1. **User-level permissions** (is_admin, user_level)
2. **Individual folder shares** (shared by other users)
3. **Group folder permissions** (if restrict_to_folders is enabled)
4. **Group default permission** (if no folder-specific permission)
5. **Granular permission flags** (can_upload, can_delete, etc.)

## Best Practices

1. **Use Groups for Teams**: Create groups for departments, projects, or teams
2. **Restrict Sensitive Folders**: Enable folder restrictions for groups that should only access specific areas
3. **Combine with User Shares**: Users can still share additional folders with group members
4. **Regular Audits**: Periodically review group permissions and memberships
5. **Descriptive Names**: Use clear, descriptive names for groups and folder paths
6. **Least Privilege**: Start with minimal permissions and add as needed

## Migration

Run the migration script to add the new permission columns:
```bash
python migrate_group_permissions.py
```

This will:
- Add new permission columns to the groups table
- Create the group_folder_permissions table
- Preserve existing group data
- Set default values for new columns

## Frontend Integration

The Admin panel now includes:
- Group permission editor with checkboxes for each permission type
- Folder permission manager for adding/removing folder access
- Visual indicators for permission levels
- Bulk permission updates

## Security Considerations

- Only administrators can create/modify groups
- Folder paths are validated to prevent directory traversal
- Permissions are enforced at the API level
- WebSocket connections respect group permissions
- Shared folders override group restrictions (additive permissions)
