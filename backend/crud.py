from sqlalchemy.orm import Session
from . import models, schemas, auth

def get_user(db: Session, username: str):
    return db.query(models.User).filter(models.User.username == username).first()

def get_users(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.User).offset(skip).limit(limit).all()

def count_enabled_super_admins(db: Session) -> int:
    """Count the number of enabled users in the 'super_admins' group."""
    return db.query(models.User).join(models.User.groups).filter(
        models.Group.name == 'super_admins',
        models.User.is_disabled == False
    ).count()

def create_user(db: Session, user: schemas.UserCreate):
    hashed_password = auth.get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        root_path=user.root_path,
        is_admin=user.is_admin,
        is_super_admin=user.is_super_admin,
        user_level=user.user_level,
        require_password_change=user.require_password_change
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    if user.groups:
        update_user_groups(db, db_user, user.groups)
        
    return db_user

def delete_user(db: Session, username: str):
    db.query(models.User).filter(models.User.username == username).delete()
    db.commit()

def update_user_password(db: Session, username: str, new_password: str):
    user = get_user(db, username)
    if user:
        user.hashed_password = auth.get_password_hash(new_password)
        user.require_password_change = False  # Clear the flag when password is changed
        db.commit()
        db.refresh(user)
    return user

def update_user(db: Session, username: str, user_update: schemas.UserUpdate):
    user = get_user(db, username)
    if not user:
        return None
    
    if user_update.username is not None:
        user.username = user_update.username
    if user_update.email is not None:
        user.email = user_update.email
    if user_update.root_path is not None:
        user.root_path = user_update.root_path
    if user_update.is_admin is not None:
        user.is_admin = user_update.is_admin
    if user_update.is_super_admin is not None:
        user.is_super_admin = user_update.is_super_admin
    if user_update.user_level is not None:
        user.user_level = user_update.user_level
    if user_update.require_password_change is not None:
        user.require_password_change = user_update.require_password_change
    if user_update.is_disabled is not None:
        user.is_disabled = user_update.is_disabled
    
    if user_update.groups is not None:
        update_user_groups(db, user, user_update.groups)
    
    db.commit()
    db.refresh(user)
    return user

# Group operations
def get_group(db: Session, group_name: str):
    return db.query(models.Group).filter(models.Group.name == group_name).first()

def get_groups(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Group).offset(skip).limit(limit).all()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(
        name=group.name,
        description=group.description,
        default_permission=group.default_permission,
        can_upload=group.can_upload,
        can_download=group.can_download,
        can_delete=group.can_delete,
        can_share=group.can_share,
        can_create_folders=group.can_create_folders,
        restrict_to_folders=group.restrict_to_folders,
        max_storage_quota=group.max_storage_quota,
        allowed_file_types=group.allowed_file_types
    )
    db.add(db_group)
    db.flush()  # Get the group ID before adding folder permissions
    
    # Add folder permissions
    if group.folder_permissions:
        for fp in group.folder_permissions:
            db_fp = models.GroupFolderPermission(
                group_id=db_group.id,
                folder_path=fp.folder_path,
                permission=fp.permission
            )
            db.add(db_fp)
    
    db.commit()
    db.refresh(db_group)
    return db_group

def update_group(db: Session, group_name: str, group_update: schemas.GroupUpdate):
    db_group = get_group(db, group_name)
    if not db_group:
        return None
    
    # Update basic fields
    if group_update.description is not None:
        db_group.description = group_update.description
    if group_update.default_permission is not None:
        db_group.default_permission = group_update.default_permission
    if group_update.can_upload is not None:
        db_group.can_upload = group_update.can_upload
    if group_update.can_download is not None:
        db_group.can_download = group_update.can_download
    if group_update.max_storage_quota is not None:
        db_group.max_storage_quota = group_update.max_storage_quota
    if group_update.allowed_file_types is not None:
        db_group.allowed_file_types = group_update.allowed_file_types
    if group_update.can_delete is not None:
        db_group.can_delete = group_update.can_delete
    if group_update.can_share is not None:
        db_group.can_share = group_update.can_share
    if group_update.can_create_folders is not None:
        db_group.can_create_folders = group_update.can_create_folders
    if group_update.restrict_to_folders is not None:
        db_group.restrict_to_folders = group_update.restrict_to_folders
    
    # Update folder permissions if provided
    if group_update.folder_permissions is not None:
        # Remove existing folder permissions
        db.query(models.GroupFolderPermission).filter(
            models.GroupFolderPermission.group_id == db_group.id
        ).delete()
        
        # Add new folder permissions
        for fp in group_update.folder_permissions:
            db_fp = models.GroupFolderPermission(
                group_id=db_group.id,
                folder_path=fp.folder_path,
                permission=fp.permission
            )
            db.add(db_fp)
    
    db.commit()
    db.refresh(db_group)
    return db_group

def delete_group(db: Session, group_name: str):
    db.query(models.Group).filter(models.Group.name == group_name).delete()
    db.commit()

def update_user_groups(db: Session, user: models.User, group_names: list[str]):
    # Clear existing groups
    user.groups = []
    
    # Add new groups
    for group_name in group_names:
        group = get_group(db, group_name)
        if group:
            user.groups.append(group)
    
    db.commit()
    db.refresh(user)

def authenticate_user(db: Session, username: str, password: str):
    # Try fetching by username
    user = get_user(db, username)
    # If not found, try fetching by email
    if not user:
        user = db.query(models.User).filter(models.User.email == username).first()
        
    if not user:
        return False
    if not auth.verify_password(password, user.hashed_password):
        return False
    return user

def update_password(db: Session, username: str, password: str):
    return update_user_password(db, username, password)

def create_folder_share(db: Session, folder_path: str, owner_username: str, shared_with_username: str, permission: str = 'read', is_file: bool = False):
    db_share = models.FolderShare(
        folder_path=folder_path,
        owner_username=owner_username,
        shared_with_username=shared_with_username,
        permission=permission,
        is_file=is_file
    )
    db.add(db_share)
    db.commit()
    db.refresh(db_share)
    return db_share
