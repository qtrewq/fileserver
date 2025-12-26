from pydantic import BaseModel
from typing import Optional, List

class GroupFolderPermission(BaseModel):
    folder_path: str
    permission: str = "read"  # 'none', 'read', 'write'
    
    class Config:
        orm_mode = True

class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    default_permission: Optional[str] = "read"
    can_upload: Optional[bool] = True
    can_download: Optional[bool] = True
    can_delete: Optional[bool] = False
    can_share: Optional[bool] = False
    can_create_folders: Optional[bool] = True
    restrict_to_folders: Optional[bool] = False
    max_storage_quota: Optional[int] = None
    allowed_file_types: Optional[str] = None

class GroupCreate(GroupBase):
    folder_permissions: Optional[List[GroupFolderPermission]] = []

class GroupUpdate(BaseModel):
    description: Optional[str] = None
    default_permission: Optional[str] = None
    can_upload: Optional[bool] = None
    can_download: Optional[bool] = None
    can_delete: Optional[bool] = None
    can_share: Optional[bool] = None
    can_create_folders: Optional[bool] = None
    restrict_to_folders: Optional[bool] = None
    max_storage_quota: Optional[int] = None
    allowed_file_types: Optional[str] = None
    folder_permissions: Optional[List[GroupFolderPermission]] = None

class Group(GroupBase):
    id: int
    folder_permissions: List[GroupFolderPermission] = []
    
    class Config:
        orm_mode = True

class UserBase(BaseModel):
    username: str
    email: Optional[str] = None
    root_path: Optional[str] = "/"
    is_admin: Optional[bool] = False
    is_super_admin: Optional[bool] = False
    user_level: Optional[str] = "read-write"
    require_password_change: Optional[bool] = False
    is_disabled: Optional[bool] = False

class UserCreate(UserBase):
    password: str
    groups: Optional[List[str]] = []  # List of group names

class User(UserBase):
    id: int
    groups: List[Group] = []
    
    class Config:
        orm_mode = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class FileInfo(BaseModel):
    name: str
    is_dir: bool
    size: Optional[int] = None
    path: str
    url_id: Optional[str] = None

class FolderCreate(BaseModel):
    name: str

class RenameItem(BaseModel):
    path: str
    new_name: str

class ShareFolder(BaseModel):
    folder_path: str  # Can be file or folder path
    username: str
    permission: str = 'read'  # 'read' or 'write'
    is_file: bool = False  # True if sharing a file

class FolderShareInfo(BaseModel):
    id: int
    folder_path: str
    owner_username: str
    shared_with_username: str
    permission: str
    is_file: bool
    
    class Config:
        orm_mode = True

class PasswordChange(BaseModel):
    current_password: Optional[str] = None  # Not required for admin resets
    new_password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    root_path: Optional[str] = None
    is_admin: Optional[bool] = None
    is_super_admin: Optional[bool] = None
    user_level: Optional[str] = None
    require_password_change: Optional[bool] = None
    is_disabled: Optional[bool] = None
    groups: Optional[List[str]] = None  # List of group names to set (replaces existing)
