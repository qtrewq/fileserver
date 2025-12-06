import os
import shutil
from typing import List
from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File, Form, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from starlette.responses import FileResponse, HTMLResponse

from . import models, schemas, crud, database, auth
from fastapi import WebSocket, WebSocketDisconnect
import json

class ConnectionManager:
    def __init__(self):
        # Map file_path -> list of {websocket, username, cursor_position}
        self.active_connections: dict[str, List[dict]] = {}

    async def connect(self, websocket: WebSocket, file_path: str, username: str):
        await websocket.accept()
        if file_path not in self.active_connections:
            self.active_connections[file_path] = []
        self.active_connections[file_path].append({
            "websocket": websocket, 
            "username": username,
            "cursor_position": 0
        })
        # Send current user list and cursor positions
        await self.broadcast_user_list(file_path)
        await self.broadcast_cursors(file_path)

    def disconnect(self, websocket: WebSocket, file_path: str):
        if file_path in self.active_connections:
            self.active_connections[file_path] = [
                conn for conn in self.active_connections[file_path]
                if conn["websocket"] != websocket
            ]
            if not self.active_connections[file_path]:
                del self.active_connections[file_path]

    async def broadcast_user_list(self, file_path: str):
        if file_path in self.active_connections:
            users = [conn["username"] for conn in self.active_connections[file_path]]
            message = json.dumps({"type": "users_update", "users": users})
            for connection in self.active_connections[file_path]:
                try:
                    await connection["websocket"].send_text(message)
                except:
                    pass

    async def broadcast_cursors(self, file_path: str):
        """Broadcast all cursor positions to all users"""
        if file_path in self.active_connections:
            cursors = [
                {"username": conn["username"], "position": conn.get("cursor_position", 0)}
                for conn in self.active_connections[file_path]
            ]
            message = json.dumps({"type": "cursors_update", "cursors": cursors})
            for connection in self.active_connections[file_path]:
                try:
                    await connection["websocket"].send_text(message)
                except:
                    pass

    def update_cursor(self, websocket: WebSocket, file_path: str, position: int):
        """Update cursor position for a specific connection"""
        if file_path in self.active_connections:
            for conn in self.active_connections[file_path]:
                if conn["websocket"] == websocket:
                    conn["cursor_position"] = position
                    return True
        return False

    async def broadcast_change(self, message: str, file_path: str, sender: WebSocket):
        if file_path in self.active_connections:
            for connection in self.active_connections[file_path]:
                if connection["websocket"] != sender:
                    try:
                        await connection["websocket"].send_text(message)
                    except:
                        pass
            print(f"WS Broadcast: Path={file_path} Recipients={len(self.active_connections[file_path])-1} MessageLen={len(message)}")
        else:
            print(f"WS Broadcast Error: Path={file_path} not in active connections. Active: {list(self.active_connections.keys())}")

manager = ConnectionManager()

app = FastAPI()

# Security Configuration
MAX_FILE_SIZE_MB = int(os.getenv("MAX_FILE_SIZE_MB", "100"))
MAX_TOTAL_UPLOAD_SIZE_MB = int(os.getenv("MAX_TOTAL_UPLOAD_SIZE_MB", "500"))
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024
MAX_TOTAL_UPLOAD_SIZE_BYTES = MAX_TOTAL_UPLOAD_SIZE_MB * 1024 * 1024

# CORS - Use environment variable for allowed origins
allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")] if allowed_origins_str != "*" else ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database
database.Base.metadata.create_all(bind=database.engine)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = auth.verify_token(token)
    if payload is None:
        raise credentials_exception
    
    username = payload.get("sub")
    if username is None:
        raise credentials_exception
    
    user = crud.get_user(db, username)
    if user is None:
        raise credentials_exception
    return user

def is_admin(user: models.User) -> bool:
    """Check if user is an admin (regular or super) based on group membership."""
    if not user or not user.groups:
        return False
    admin_groups = {'admins', 'super_admins'}
    user_group_names = {g.name for g in user.groups}
    return bool(admin_groups & user_group_names)

def is_super_admin(user: models.User) -> bool:
    """Check if user is a super admin based on group membership."""
    if not user or not user.groups:
        return False
    return any(g.name == 'super_admins' for g in user.groups)


def get_safe_path(user: models.User, path: str = ""):
    storage_root = os.path.abspath(os.getenv("STORAGE_ROOT", "./storage"))
    
    # Handle root path correctly
    user_root_path = user.root_path.strip("/")
    user_root = os.path.join(storage_root, user_root_path)
    
    # Ensure user root exists
    if not os.path.exists(user_root):
        try:
            os.makedirs(user_root, exist_ok=True)
        except OSError as e:
            print(f"Error creating user root: {e}")
            raise HTTPException(status_code=500, detail="[ERR_FS_CREATE] Could not create user storage directory")

    # Normalize user_root to ensure consistent comparison
    user_root = os.path.normpath(user_root)

    # Construct full path
    full_path = os.path.abspath(os.path.join(user_root, path.strip("/")))
    
    # Security check: Ensure path is within user_root
    if not full_path.startswith(user_root):
        print(f"Access denied: {full_path} is not inside {user_root}")
        raise HTTPException(status_code=403, detail="[ERR_ACCESS_DENIED] Access denied: Path traversal detected")
    
    return full_path

# --- Auth Endpoints ---
@app.post("/api/token")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db), request: Request = None):
    # Get client IP
    client_ip = request.client.host if request else "unknown"
    
    # Check IP rate limiting
    if auth.is_ip_rate_limited(client_ip):
        raise HTTPException(
            status_code=429,
            detail="Too many login attempts from this IP address. Please try again later."
        )
    
    # Check account lockout
    if auth.is_account_locked(form_data.username):
        remaining_time = auth.get_lockout_time_remaining(form_data.username)
        minutes = remaining_time // 60
        seconds = remaining_time % 60
        raise HTTPException(
            status_code=423,
            detail=f"Account is temporarily locked due to multiple failed login attempts. Please try again in {minutes}m {seconds}s."
        )
    
    # Attempt authentication
    user = crud.authenticate_user(db, form_data.username, form_data.password)
    
    if not user:
        # Record failed login attempt
        auth.record_failed_login(form_data.username, client_ip)
        
        # Get updated attempt count
        attempts = auth.get_failed_attempts_count(form_data.username)
        remaining = auth.MAX_LOGIN_ATTEMPTS - attempts
        
        if remaining > 0:
            raise HTTPException(
                status_code=401,
                detail=f"Incorrect username or password. {remaining} attempt(s) remaining before account lockout."
            )
        else:
            raise HTTPException(
                status_code=401,
                detail="Incorrect username or password. Account has been locked."
            )
    
    # Check if account is disabled
    if user.is_disabled:
        raise HTTPException(
            status_code=403,
            detail="Account has been disabled. Please contact an administrator."
        )
    
    # Record successful login
    auth.record_successful_login(form_data.username)
    
    # Create tokens
    access_token = auth.create_access_token(data={"sub": user.username})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "username": user.username,
        "is_admin": is_admin(user),
        "require_password_change": user.require_password_change
    }

# --- User Endpoints ---
@app.get("/api/users/me", response_model=schemas.User)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.get("/api/users", response_model=List[schemas.User])
def read_users(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    return crud.get_users(db)

@app.post("/api/users", response_model=schemas.User)
def create_user(user: schemas.UserCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    db_user = crud.get_user(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already exists")
    return crud.create_user(db, user)

@app.delete("/api/users/{username}")
def delete_user(username: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not is_super_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    if username == current_user.username:
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    
    target_user = crud.get_user(db, username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
        
    if is_super_admin(target_user):
        if crud.count_enabled_super_admins(db) <= 1:
            raise HTTPException(status_code=400, detail="Cannot delete the last enabled super admin")
            
    crud.delete_user(db, username)
    return {"status": "deleted"}

@app.put("/api/users/{username}", response_model=schemas.User)
def update_user(
    username: str,
    user_update: schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db_user = crud.get_user(db, username)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if trying to change username and if new username already exists
    if user_update.username and user_update.username != username:
        existing_user = crud.get_user(db, user_update.username)
        if existing_user:
            raise HTTPException(status_code=400, detail="Username already exists")
            
    # Check if disabling or removing super admin status from the last super admin
    if is_super_admin(db_user):
        # If disabling
        if user_update.is_disabled and not db_user.is_disabled:
            if crud.count_enabled_super_admins(db) <= 1:
                raise HTTPException(status_code=400, detail="Cannot disable the last enabled super admin")
        
        # If removing group
        if user_update.groups is not None:
            if 'super_admins' not in user_update.groups:
                if crud.count_enabled_super_admins(db) <= 1:
                    raise HTTPException(status_code=400, detail="Cannot remove super admin privileges from the last enabled super admin")
    
    updated_user = crud.update_user(db, username, user_update)
    return updated_user

@app.post("/api/users/{username}/reset-password")
def admin_reset_password(
    username: str,
    request: schemas.PasswordChange,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not is_admin(current_user):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    target_user = crud.get_user(db, username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    crud.update_password(db, username, request.new_password)
    return {"status": "password reset"}

@app.put("/api/users/change-password")
def change_password(
    currentPassword: str = Form(...),
    newPassword: str = Form(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not crud.authenticate_user(db, current_user.username, currentPassword):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    crud.update_password(db, current_user.username, newPassword)
    return {"status": "password changed"}


# --- File Endpoints ---
@app.get("/api/files/{path:path}")
def list_or_get_file(path: str = "", db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    safe_path = None
    try:
        safe_path = get_safe_path(current_user, path)
    except:
        pass

    if not safe_path or not os.path.exists(safe_path):
        share = db.query(models.FolderShare).filter(
            models.FolderShare.shared_with_username == current_user.username,
            models.FolderShare.folder_path == path,
            models.FolderShare.is_file == True
        ).first()
        if share:
            owner = crud.get_user(db, share.owner_username)
            if owner:
                try:
                    safe_path = get_safe_path(owner, path)
                except:
                    pass

    if not safe_path or not os.path.exists(safe_path):
         raise HTTPException(status_code=404, detail="[ERR_NOT_FOUND] File or directory not found")
    
    if os.path.isdir(safe_path):
        try:
            items = []
            for item_name in os.listdir(safe_path):
                item_path = os.path.join(safe_path, item_name)
                is_dir = os.path.isdir(item_path)
                size = 0 if is_dir else os.path.getsize(item_path)
                modified = os.path.getmtime(item_path)
                items.append({
                    "name": item_name,
                    "is_dir": is_dir,
                    "size": size,
                    "modified": modified,
                    "path": os.path.join(path, item_name).replace("\\", "/") if path else item_name
                })
            return items
        except OSError as e:
            print(f"List dir error: {e}")
            raise HTTPException(status_code=500, detail=f"[ERR_LIST_DIR] Failed to list directory: {str(e)}")
            
    elif os.path.isfile(safe_path):
        return FileResponse(safe_path)
    else:
        raise HTTPException(status_code=404, detail="[ERR_NOT_FOUND] File or directory not found")

@app.post("/api/upload/{path:path}")
async def upload_files(
    path: str = "",
    files: List[UploadFile] = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # Check permission
    auth.check_permission(current_user, 'can_upload')
    
    # Check file types if restricted
    perms = auth.resolve_user_permissions(current_user)
    allowed_types = perms.get('allowed_file_types')
    
    if allowed_types:
        allowed_set = set(t.strip().lower() for t in allowed_types.split(','))
        for file in files:
            ext = os.path.splitext(file.filename)[1].lower()
            if ext not in allowed_set:
                 raise HTTPException(status_code=403, detail=f"File type not allowed: {ext}")

    try:
        safe_path = get_safe_path(current_user, path)
        os.makedirs(safe_path, exist_ok=True)
        
        uploaded_files = []
        total_size = 0
        
        for file in files:
            # Check individual file size
            file_content = await file.read()
            file_size = len(file_content)
            
            if file_size > MAX_FILE_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"File {file.filename} exceeds maximum size of {MAX_FILE_SIZE_MB}MB"
                )
            
            total_size += file_size
            
            # Check total upload size
            if total_size > MAX_TOTAL_UPLOAD_SIZE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"Total upload size exceeds maximum of {MAX_TOTAL_UPLOAD_SIZE_MB}MB"
                )
            
            # Handle folder structure - filename may contain relative path like "folder/subfolder/file.txt"
            # This happens when using webkitdirectory attribute
            file_relative_path = file.filename.replace('\\', '/')  # Normalize path separators
            full_file_path = os.path.join(safe_path, file_relative_path)
            
            # Security check for the relative path
            if not os.path.abspath(full_file_path).startswith(safe_path):
                 print(f"Skipping unsafe file path: {file.filename}")
                 continue

            # Create parent directories if they don't exist
            try:
                os.makedirs(os.path.dirname(full_file_path), exist_ok=True)
            except OSError as e:
                 raise HTTPException(status_code=500, detail=f"[ERR_DIR_CREATE] Failed to create directory for file: {str(e)}")
            
            try:
                with open(full_file_path, "wb") as f:
                    f.write(file_content)
                uploaded_files.append(file_relative_path)

                # Broadcast update to WebSocket clients
                try:
                    # Attempt to decode as text
                    text_content = file_content.decode('utf-8')
                    
                    # Normalize path for broadcasting (must match websocket_endpoint logic)
                    broadcast_path = os.path.abspath(full_file_path)
                    if os.name == 'nt':
                        broadcast_path = broadcast_path.lower()
                    
                    # Construct message
                    msg = json.dumps({
                        "type": "content_update",
                        "content": text_content
                    })
                    
                    # Broadcast (sender=None means send to all)
                    await manager.broadcast_change(msg, broadcast_path, None)
                    print(f"Saved and broadcasted update for: {broadcast_path}")
                    
                except UnicodeDecodeError:
                    pass # Not a text file, skip broadcast
                except Exception as e:
                    print(f"Error broadcasting update: {e}")
            except OSError as e:
                raise HTTPException(status_code=500, detail=f"[ERR_FILE_WRITE] Failed to write file {file.filename}: {str(e)}")
        
        return {"status": "uploaded", "files": uploaded_files}
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=f"[ERR_UPLOAD_GENERIC] Upload failed: {str(e)}")

@app.post("/api/save-file")
async def save_file(
    file_path: str = Form(...),
    content: str = Form(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Save file content - used by editor autosave. Checks file access permission."""
    try:
        # Try to resolve path in user's root
        safe_path = None
        try:
            safe_path = get_safe_path(current_user, file_path)
        except:
            pass
        
        # If not in user's root, check if it's a shared file
        if not safe_path or not os.path.exists(safe_path):
            share = db.query(models.FolderShare).filter(
                models.FolderShare.shared_with_username == current_user.username,
                models.FolderShare.folder_path == file_path,
                models.FolderShare.is_file == True
            ).first()
            
            if share:
                owner = crud.get_user(db, share.owner_username)
                if owner:
                    try:
                        safe_path = get_safe_path(owner, file_path)
                    except:
                        pass
        
        if not safe_path:
            raise HTTPException(status_code=404, detail="File not found or access denied")
        
        # Write content
        with open(safe_path, "w", encoding="utf-8") as f:
            f.write(content)
        
        # Broadcast update to WebSocket clients
        try:
            # Normalize path for broadcasting
            broadcast_path = os.path.abspath(safe_path)
            if os.name == 'nt':
                broadcast_path = broadcast_path.lower()
            
            # Construct message
            msg = json.dumps({
                "type": "content_update",
                "content": content
            })
            
            # Broadcast (sender=None means send to all)
            await manager.broadcast_change(msg, broadcast_path, None)
            print(f"Saved and broadcasted update for: {broadcast_path}")
        except Exception as e:
            print(f"Error broadcasting update: {e}")
        
        return {"status": "saved"}
        
    except HTTPException as e:
        raise e
    except Exception as e:
        print(f"Save error: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to save file: {str(e)}")


@app.post("/api/mkdir/{path:path}")
def create_directory(path: str, current_user: models.User = Depends(get_current_user)):
    auth.check_permission(current_user, 'can_create_folders')
    try:
        safe_path = get_safe_path(current_user, path)
        
        if os.path.exists(safe_path):
             raise HTTPException(status_code=409, detail="[ERR_EXISTS] Folder already exists")

        os.makedirs(safe_path, exist_ok=True)
        return {"status": "created"}
    except HTTPException as e:
        raise e
    except OSError as e:
        print(f"Create folder error: {e}")
        raise HTTPException(status_code=500, detail=f"[ERR_FOLDER_CREATE] Failed to create folder: {str(e)}")
    except Exception as e:
        print(f"Create folder generic error: {e}")
        raise HTTPException(status_code=500, detail=f"[ERR_FOLDER_GENERIC] Failed to create folder: {str(e)}")

@app.post("/api/folders/{path:path}")
def create_folder(path: str = "", name: str = Form(...), current_user: models.User = Depends(get_current_user)):
    auth.check_permission(current_user, 'can_create_folders')
    # Deprecated/Legacy support if needed, but /mkdir/ is what frontend uses
    try:
        safe_path = get_safe_path(current_user, path)
        new_folder = os.path.join(safe_path, name)
        
        if os.path.exists(new_folder):
             raise HTTPException(status_code=409, detail="[ERR_EXISTS] Folder already exists")

        os.makedirs(new_folder, exist_ok=True)
        return {"status": "created"}
    except HTTPException as e:
        raise e
    except OSError as e:
        print(f"Create folder error: {e}")
        raise HTTPException(status_code=500, detail=f"[ERR_FOLDER_CREATE] Failed to create folder: {str(e)}")
    except Exception as e:
        print(f"Create folder generic error: {e}")
        raise HTTPException(status_code=500, detail=f"[ERR_FOLDER_GENERIC] Failed to create folder: {str(e)}")

@app.delete("/api/files/{path:path}")
def delete_file(path: str, current_user: models.User = Depends(get_current_user)):
    auth.check_permission(current_user, 'can_delete')
    safe_path = get_safe_path(current_user, path)
    if os.path.isdir(safe_path):
        shutil.rmtree(safe_path)
    else:
        os.remove(safe_path)
    return {"status": "deleted"}

# --- Sharing Endpoints ---
@app.post("/api/share")
def share_folder(
    share: schemas.ShareFolder,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    auth.check_permission(current_user, 'can_share')
    target_user = crud.get_user(db, share.username)
    if not target_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check if it's a file
    safe_path = get_safe_path(current_user, share.folder_path)
    is_file = os.path.isfile(safe_path)
    
    crud.create_folder_share(db, share.folder_path, current_user.username, share.username, share.permission, is_file=is_file)
    return {"status": "shared"}

@app.get("/api/shared-with-me", response_model=List[schemas.FolderShareInfo])
def get_shared_with_me(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    shares = db.query(models.FolderShare).filter(
        models.FolderShare.shared_with_username == current_user.username
    ).all()
    return shares

@app.delete("/api/share/{share_id}")
async def unshare_folder(share_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    share = db.query(models.FolderShare).filter(models.FolderShare.id == share_id).first()
    if not share:
        raise HTTPException(status_code=404, detail="Share not found")
    
    if share.owner_username != current_user.username:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.delete(share)
    db.commit()
    return {"status": "unshared"}

# --- Group Endpoints ---
@app.post("/api/groups/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.get_group(db, group_name=group.name)
    if db_group:
        raise HTTPException(status_code=400, detail="Group already exists")
    return crud.create_group(db=db, group=group)

@app.get("/api/groups/", response_model=List[schemas.Group])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    groups = crud.get_groups(db, skip=skip, limit=limit)
    return groups

@app.get("/api/groups/{group_name}/", response_model=schemas.Group)
def read_group(group_name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.get_group(db, group_name=group_name)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

@app.put("/api/groups/{group_name}/", response_model=schemas.Group)
def update_group(group_name: str, group: schemas.GroupUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.update_group(db, group_name=group_name, group_update=group)
    if db_group is None:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

@app.delete("/api/groups/{group_name}/")
def delete_group(group_name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
        
    if group_name in ['admins', 'super_admins']:
        raise HTTPException(status_code=400, detail="Cannot delete system groups")
        
    db_group = crud.get_group(db, group_name=group_name)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    db.delete(db_group)
    db.commit()
    return {"status": "deleted"}

@app.websocket("/ws/{file_path:path}")
async def websocket_endpoint(
    websocket: WebSocket, 
    file_path: str, 
    token: str,
    db: Session = Depends(get_db)
):
    # Validate token
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
            return
            
        # Get user for permission check
        user = crud.get_user(db, username)
        if not user:
             await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
             return
    except:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    # Resolve canonical path
    canonical_path = None
    
    # 1. Try resolving in user's root using safe path logic
    try:
        candidate_path = get_safe_path(user, file_path)
        if os.path.exists(candidate_path):
            canonical_path = candidate_path
    except:
        pass
        
    # 2. If not found locally, check shares
    if not canonical_path:
        # Check direct file share
        share = db.query(models.FolderShare).filter(
            models.FolderShare.shared_with_username == username,
            models.FolderShare.folder_path == file_path,
            models.FolderShare.is_file == True
        ).first()

        if share:
            owner = crud.get_user(db, share.owner_username)
            if owner:
                try:
                    canonical_path = get_safe_path(owner, file_path)
                except:
                    pass
        
        # Check folder shares (recursive parent check)
        if not canonical_path:
            path_parts = file_path.split('/')
            for i in range(len(path_parts), 0, -1):
                check_path = "/".join(path_parts[:i])
                share = db.query(models.FolderShare).filter(
                    models.FolderShare.shared_with_username == username,
                    models.FolderShare.folder_path == check_path,
                    models.FolderShare.is_file == False
                ).first()
                if share:
                    owner = crud.get_user(db, share.owner_username)
                    if owner:
                        try:
                            # Verify the file actually exists in owner's space
                            possible_path = get_safe_path(owner, file_path)
                            if os.path.exists(possible_path):
                                canonical_path = possible_path
                        except:
                            pass
                    break

    print(f"WS Connect: User={username} ReqPath={file_path} Canonical={canonical_path}")

    if not canonical_path:
         print(f"WS Connect Failed: Access Denied for {username} to {file_path}")
         await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
         return

    # Normalize path case for Windows to ensure consistent room keys
    if os.name == 'nt':
        canonical_path = canonical_path.lower()

    await manager.connect(websocket, canonical_path, username)
    try:
        while True:
            data = await websocket.receive_text()
            # Parse and handle different message types
            try:
                message = json.loads(data)
                
                # Handle cursor position updates
                if message.get("type") == "cursor_update":
                    position = message.get("position", 0)
                    manager.update_cursor(websocket, canonical_path, position)
                    await manager.broadcast_cursors(canonical_path)
                else:
                    # Broadcast other changes (content updates, etc.)
                    await manager.broadcast_change(data, canonical_path, websocket)
            except json.JSONDecodeError:
                # If not JSON, just forward it (backward compatibility)
                await manager.broadcast_change(data, canonical_path, websocket)
    except WebSocketDisconnect:
        manager.disconnect(websocket, canonical_path)
        await manager.broadcast_user_list(canonical_path)
        await manager.broadcast_cursors(canonical_path)

# --- Python Runner Endpoints ---
from .python_runner import runner
from pydantic import BaseModel

class RunPythonRequest(BaseModel):
    content: str
    session_id: str
    file_name: str = "script.py"
    path: str = ""

class InstallPackageRequest(BaseModel):
    session_id: str
    package_name: str

@app.post("/api/python/run")
async def run_python(request: RunPythonRequest, current_user: models.User = Depends(get_current_user)):
    """Run Python code in an isolated environment"""
    
    # Determine source directory
    source_dir = None
    try:
        # Resolve the path to a real filesystem path
        # request.path is the directory containing the file (from frontend currentPath)
        safe_path = get_safe_path(current_user, request.path)
        
        if os.path.isdir(safe_path):
            source_dir = safe_path
        elif os.path.isfile(safe_path):
            source_dir = os.path.dirname(safe_path)
            
    except Exception as e:
        print(f"Error resolving source directory: {e}")
        # Continue without source_dir if resolution fails
    
    result = await runner.run_python_file(request.session_id, request.content, request.file_name, source_dir)
    return result

@app.post("/api/python/install")
async def install_package(request: InstallPackageRequest, current_user: models.User = Depends(get_current_user)):
    """Install a package in the isolated environment"""
    result = await runner.install_package(request.session_id, request.package_name)
    return result

@app.delete("/api/python/cleanup/{session_id}")
async def cleanup_environment(session_id: str, current_user: models.User = Depends(get_current_user)):
    """Clean up the isolated environment"""
    runner.cleanup_environment(session_id)
    return {"status": "cleaned up"}

@app.on_event("shutdown")
def shutdown_event():
    """Clean up all environments on shutdown"""
    runner.cleanup_all()


# Group Management Endpoints
@app.post("/api/groups/", response_model=schemas.Group)
def create_group(group: schemas.GroupCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.get_group(db, group_name=group.name)
    if db_group:
        raise HTTPException(status_code=400, detail="Group already registered")
    return crud.create_group(db=db, group=group)

@app.get("/api/groups/", response_model=List[schemas.Group])
def read_groups(skip: int = 0, limit: int = 100, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    groups = crud.get_groups(db, skip=skip, limit=limit)
    return groups

@app.delete("/api/groups/{group_name}/")
def delete_group(group_name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.get_group(db, group_name=group_name)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    crud.delete_group(db, group_name)
    return {"status": "success"}

@app.put("/api/groups/{group_name}/", response_model=schemas.Group)
def update_group(group_name: str, group_update: schemas.GroupUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.update_group(db, group_name=group_name, group_update=group_update)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

@app.get("/api/groups/{group_name}/", response_model=schemas.Group)
def read_group(group_name: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Not authorized")
    db_group = crud.get_group(db, group_name=group_name)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group


# WebSocket endpoint for collaborative editing
@app.websocket("/ws/{file_path:path}")
async def websocket_endpoint(websocket: WebSocket, file_path: str, token: str = None):
    # Authenticate the WebSocket connection
    if not token:
        await websocket.close(code=1008)
        return
    
    try:
        # Verify token and get user
        payload = auth.verify_token(token)
        username = payload.get("sub")
        if not username:
            await websocket.close(code=1008)
            return
        
        # Accept the connection
        await websocket.accept()
        await manager.connect(websocket, file_path, username)
        
        try:
            while True:
                # Receive message from client
                data = await websocket.receive_text()
                # Broadcast to all other clients editing the same file
                await manager.broadcast_change(data, file_path, websocket)
        except WebSocketDisconnect:
            manager.disconnect(websocket, file_path)
            await manager.broadcast_user_list(file_path)
    except Exception as e:
        print(f"WebSocket error: {e}")
        try:
            await websocket.close(code=1011)
        except:
            pass


# Initialize Admin User
@app.on_event("startup")
def startup_event():
    db = database.SessionLocal()
    user = crud.get_user(db, "admin")
    if not user:
        crud.create_user(db, schemas.UserCreate(
            username="admin",
            password="adminpassword",
            root_path="/",
            is_admin=True,
            is_super_admin=True
        ))
    db.close()

# Serve static files
if os.path.exists("frontend/dist"):
    app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")
    
    # Catch-all route for SPA - must be last
    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # If it's an API or WebSocket route, let it 404 naturally
        if full_path.startswith("api/") or full_path.startswith("ws/"):
            raise HTTPException(status_code=404, detail="Not found")
        
        # Try to serve static file from dist root (like vite.svg)
        static_file = os.path.join("frontend/dist", full_path)
        if os.path.isfile(static_file):
            return FileResponse(static_file)
        
        # Serve index.html for all other routes (SPA routing)
        index_path = os.path.join("frontend/dist", "index.html")
        if os.path.exists(index_path):
            with open(index_path, "r", encoding="utf-8") as f:
                return HTMLResponse(content=f.read())
        raise HTTPException(status_code=404, detail="Frontend not found")
