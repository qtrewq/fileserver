from sqlalchemy import Boolean, Column, Integer, String, ForeignKey, Text
from sqlalchemy.orm import relationship
from .database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    root_path = Column(String, default="/") # Relative to the fileserver storage root
    is_admin = Column(Boolean, default=False)
    is_super_admin = Column(Boolean, default=False)
    user_level = Column(String, default="read-write")  # 'read-only', 'read-write', 'admin'
    require_password_change = Column(Boolean, default=False)
    is_disabled = Column(Boolean, default=False)
    groups = relationship("Group", secondary="user_groups", back_populates="users")

class Group(Base):
    __tablename__ = "groups"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    description = Column(String, nullable=True)
    # Permission settings
    default_permission = Column(String, default="read")  # 'none', 'read', 'write', 'admin'
    can_upload = Column(Boolean, default=True)
    can_download = Column(Boolean, default=True)
    can_delete = Column(Boolean, default=False)
    can_share = Column(Boolean, default=False)
    can_create_folders = Column(Boolean, default=True)
    # Folder access restrictions
    restrict_to_folders = Column(Boolean, default=False)  # If True, only allowed_folders are accessible
    
    # New Customizations
    max_storage_quota = Column(Integer, nullable=True) # In bytes, None means unlimited
    allowed_file_types = Column(String, nullable=True) # Comma separated extensions, e.g. ".jpg,.png", None means all
    
    users = relationship("User", secondary="user_groups", back_populates="groups")
    folder_permissions = relationship("GroupFolderPermission", back_populates="group", cascade="all, delete-orphan")

class UserGroup(Base):
    __tablename__ = "user_groups"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    group_id = Column(Integer, ForeignKey("groups.id"), primary_key=True)

class GroupFolderPermission(Base):
    __tablename__ = "group_folder_permissions"
    
    id = Column(Integer, primary_key=True, index=True)
    group_id = Column(Integer, ForeignKey("groups.id"), index=True)
    folder_path = Column(String, index=True)  # Path to folder (relative to storage root)
    permission = Column(String, default="read")  # 'none', 'read', 'write'
    
    group = relationship("Group", back_populates="folder_permissions")

class FolderShare(Base):
    __tablename__ = "folder_shares"
    
    id = Column(Integer, primary_key=True, index=True)
    folder_path = Column(String, index=True)  # Can be file or folder path
    owner_username = Column(String, index=True)
    shared_with_username = Column(String, index=True)
    permission = Column(String, default='read')  # 'read' or 'write'
    is_file = Column(Boolean, default=False)  # True if sharing a file, False if folder
