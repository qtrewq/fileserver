from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
import os
import secrets

# Security Configuration
SECRET_KEY = os.getenv("SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

# Rate limiting and lockout configuration
MAX_LOGIN_ATTEMPTS = int(os.getenv("MAX_LOGIN_ATTEMPTS", "5"))
LOCKOUT_DURATION_MINUTES = int(os.getenv("LOCKOUT_DURATION_MINUTES", "15"))
RATE_LIMIT_WINDOW_SECONDS = int(os.getenv("RATE_LIMIT_WINDOW_SECONDS", "60"))

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# In-memory storage for login attempts (in production, use Redis or database)
login_attempts = {}  # {username: {"count": int, "last_attempt": datetime, "locked_until": datetime}}
ip_attempts = {}  # {ip: {"count": int, "last_attempt": datetime}}

# Password requirements
MIN_PASSWORD_LENGTH = int(os.getenv("MIN_PASSWORD_LENGTH", "8"))
REQUIRE_UPPERCASE = os.getenv("REQUIRE_UPPERCASE", "true").lower() == "true"
REQUIRE_LOWERCASE = os.getenv("REQUIRE_LOWERCASE", "true").lower() == "true"
REQUIRE_DIGIT = os.getenv("REQUIRE_DIGIT", "true").lower() == "true"
REQUIRE_SPECIAL_CHAR = os.getenv("REQUIRE_SPECIAL_CHAR", "false").lower() == "true"

def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password against security requirements.
    Returns (is_valid, error_message)
    """
    if len(password) < MIN_PASSWORD_LENGTH:
        return False, f"Password must be at least {MIN_PASSWORD_LENGTH} characters long"
    
    if REQUIRE_UPPERCASE and not any(c.isupper() for c in password):
        return False, "Password must contain at least one uppercase letter"
    
    if REQUIRE_LOWERCASE and not any(c.islower() for c in password):
        return False, "Password must contain at least one lowercase letter"
    
    if REQUIRE_DIGIT and not any(c.isdigit() for c in password):
        return False, "Password must contain at least one digit"
    
    if REQUIRE_SPECIAL_CHAR and not any(c in "!@#$%^&*()_+-=[]{}|;:,.<>?" for c in password):
        return False, "Password must contain at least one special character"
    
    return True, ""

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire, "type": "access"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def create_refresh_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire, "type": "refresh"})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except JWTError:
        return None

def is_account_locked(username: str) -> bool:
    """Check if account is locked due to failed login attempts"""
    if username not in login_attempts:
        return False
    
    attempt_data = login_attempts[username]
    locked_until = attempt_data.get("locked_until")
    
    if locked_until and datetime.utcnow() < locked_until:
        return True
    
    # Clear lockout if time has passed
    if locked_until and datetime.utcnow() >= locked_until:
        login_attempts[username] = {"count": 0, "last_attempt": datetime.utcnow(), "locked_until": None}
    
    return False

def is_ip_rate_limited(ip: str) -> bool:
    """Check if IP is rate limited"""
    if ip not in ip_attempts:
        return False
    
    attempt_data = ip_attempts[ip]
    last_attempt = attempt_data.get("last_attempt")
    count = attempt_data.get("count", 0)
    
    # Reset counter if window has passed
    if last_attempt and (datetime.utcnow() - last_attempt).total_seconds() > RATE_LIMIT_WINDOW_SECONDS:
        ip_attempts[ip] = {"count": 0, "last_attempt": datetime.utcnow()}
        return False
    
    # Check if too many attempts in window
    return count >= MAX_LOGIN_ATTEMPTS * 2  # IP limit is 2x user limit

def record_failed_login(username: str, ip: str):
    """Record a failed login attempt"""
    now = datetime.utcnow()
    
    # Record username attempt
    if username not in login_attempts:
        login_attempts[username] = {"count": 0, "last_attempt": now, "locked_until": None}
    
    login_attempts[username]["count"] += 1
    login_attempts[username]["last_attempt"] = now
    
    # Lock account if too many attempts
    if login_attempts[username]["count"] >= MAX_LOGIN_ATTEMPTS:
        login_attempts[username]["locked_until"] = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
    
    # Record IP attempt
    if ip not in ip_attempts:
        ip_attempts[ip] = {"count": 0, "last_attempt": now}
    
    # Reset IP counter if window has passed
    if (now - ip_attempts[ip]["last_attempt"]).total_seconds() > RATE_LIMIT_WINDOW_SECONDS:
        ip_attempts[ip] = {"count": 1, "last_attempt": now}
    else:
        ip_attempts[ip]["count"] += 1
        ip_attempts[ip]["last_attempt"] = now

def record_successful_login(username: str):
    """Clear failed login attempts on successful login"""
    if username in login_attempts:
        login_attempts[username] = {"count": 0, "last_attempt": datetime.utcnow(), "locked_until": None}

def get_lockout_time_remaining(username: str) -> Optional[int]:
    """Get remaining lockout time in seconds"""
    if username not in login_attempts:
        return None
    
    locked_until = login_attempts[username].get("locked_until")
    if not locked_until:
        return None
    
    remaining = (locked_until - datetime.utcnow()).total_seconds()
    return max(0, int(remaining))

def get_failed_attempts_count(username: str) -> int:
    """Get number of failed login attempts"""
    if username not in login_attempts:
        return 0
    return login_attempts[username].get("count", 0)

from fastapi import HTTPException
# Import models inside function to avoid circular import issues if any
# or use TYPE_CHECKING
from typing import TYPE_CHECKING
if TYPE_CHECKING:
    from . import models

def resolve_user_permissions(user: 'models.User') -> dict:
    """
    Resolve permissions for a user based on their groups.
    Returns a dictionary of permissions.
    """
    # Default permissions (restrictive)
    permissions = {
        "can_upload": False,
        "can_download": False,
        "can_delete": False,
        "can_share": False,
        "can_create_folders": False,
        "max_storage_quota": 0, # Default to 0 if no groups
        "allowed_file_types": "" # Default to empty (none allowed) if no groups
    }
    
    
    # Check if user is admin based on group membership only
    is_admin_user = False
    if user.groups:
        admin_group_names = {'admins', 'super_admins'}
        user_group_names = {g.name for g in user.groups}
        is_admin_user = bool(admin_group_names & user_group_names)
    
    # Admins get full permissions
    if is_admin_user:
        return {
            "can_upload": True,
            "can_download": True,
            "can_delete": True,
            "can_share": True,
            "can_create_folders": True,
            "max_storage_quota": None, # Unlimited
            "allowed_file_types": None # All allowed
        }

    has_unlimited_quota = False
    max_quota = 0
    
    has_unrestricted_files = False
    allowed_extensions = set()
    
    # If user has no groups, they keep default restrictive permissions
    if not user.groups:
        return permissions
        
    for group in user.groups:
        if group.can_upload: permissions["can_upload"] = True
        if group.can_download: permissions["can_download"] = True
        if group.can_delete: permissions["can_delete"] = True
        if group.can_share: permissions["can_share"] = True
        if group.can_create_folders: permissions["can_create_folders"] = True
        
        # Quota logic
        if group.max_storage_quota is None:
            has_unlimited_quota = True
        elif group.max_storage_quota > max_quota:
            max_quota = group.max_storage_quota
            
        # File type logic
        if group.allowed_file_types is None:
            has_unrestricted_files = True
        elif group.allowed_file_types:
            # Add extensions to set
            exts = [e.strip().lower() for e in group.allowed_file_types.split(",")]
            allowed_extensions.update(exts)

    # Finalize quota
    if has_unlimited_quota:
        permissions["max_storage_quota"] = None
    else:
        permissions["max_storage_quota"] = max_quota
        
    # Finalize file types
    if has_unrestricted_files:
        permissions["allowed_file_types"] = None
    else:
        # If we have allowed extensions, join them. If set is empty but has_unrestricted_files is False,
        # it means all groups had restrictions but empty lists? Or no groups had allowed_file_types set?
        # If allowed_extensions is empty and not unrestricted, it effectively means NO types allowed (if can_upload is True).
        # But usually allowed_file_types=None means all.
        if allowed_extensions:
            permissions["allowed_file_types"] = ",".join(allowed_extensions)
        else:
            permissions["allowed_file_types"] = None # Fallback to all if logic implies it, or empty string?
            # If all groups have allowed_file_types="something", we collect them.
            # If all groups have allowed_file_types="", then allowed_extensions is empty.
            # This implies NO files allowed.
            pass

    return permissions

def check_permission(user: 'models.User', permission: str):
    """
    Check if user has a specific permission.
    Raises HTTPException if not authorized.
    """
    perms = resolve_user_permissions(user)
    if not perms.get(permission):
        raise HTTPException(status_code=403, detail=f"Permission denied: {permission} required")
