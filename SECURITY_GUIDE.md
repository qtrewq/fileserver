# Enhanced Security Configuration Guide

## Overview
The fileserver now includes comprehensive security enhancements for the authentication system, including rate limiting, account lockout, and configurable security parameters.

## Security Features

### 1. **Account Lockout Protection**
- Accounts are temporarily locked after too many failed login attempts
- Default: **5 failed attempts** triggers a **15-minute lockout**
- Lockout is automatically cleared after the duration expires
- Users are informed of remaining attempts and lockout time

### 2. **IP-Based Rate Limiting**
- Prevents brute force attacks from specific IP addresses
- IP limit is 2x the per-account limit (default: 10 attempts per 60 seconds)
- Rate limit window resets automatically

### 3. **Secure Token Management**
- JWT tokens with configurable expiration
- Access tokens: 30 minutes (default)
- Refresh tokens: 7 days (default)
- Tokens include type identifier for additional security

### 4. **Environment-Based Secret Key**
- Secret key can be set via environment variable
- Auto-generates secure random key if not provided
- Never hardcode secrets in production

### 5. **Enhanced Login Response**
- Returns user information (username, admin status, password change requirement)
- Provides detailed feedback on failed attempts
- Clear error messages for locked accounts

## Configuration

### Environment Variables

Create a `.env` file in the project root with these optional settings:

```env
# Security Settings
SECRET_KEY=your-super-secret-key-here-minimum-32-characters
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# Rate Limiting & Lockout
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_DURATION_MINUTES=15
RATE_LIMIT_WINDOW_SECONDS=60
```

### Recommended Production Settings

```env
# Strong secret key (generate with: python -c "import secrets; print(secrets.token_urlsafe(32))")
SECRET_KEY=<generated-secret-key>

# Shorter token expiration for high-security environments
ACCESS_TOKEN_EXPIRE_MINUTES=15
REFRESH_TOKEN_EXPIRE_DAYS=1

# Stricter rate limiting
MAX_LOGIN_ATTEMPTS=3
LOCKOUT_DURATION_MINUTES=30
RATE_LIMIT_WINDOW_SECONDS=60
```

## Security Best Practices

### 1. **Generate a Strong Secret Key**
```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```
Add the output to your `.env` file as `SECRET_KEY`.

### 2. **Use HTTPS in Production**
Always use HTTPS to encrypt data in transit. Configure your reverse proxy (nginx, Apache) with SSL/TLS certificates.

### 3. **Regular Security Audits**
- Monitor failed login attempts
- Review locked accounts
- Check for unusual IP activity

### 4. **Password Policies**
- Enforce strong passwords (implemented via `require_password_change`)
- Require password changes for new accounts
- Consider implementing password complexity requirements

### 5. **Database Security**
- Use strong database passwords
- Limit database access to localhost
- Regular backups (use the provided backup script)

## Error Codes

### Authentication Errors
- **401 Unauthorized**: Invalid credentials
- **423 Locked**: Account temporarily locked
- **429 Too Many Requests**: IP rate limit exceeded

### Error Messages
- Failed login attempts show remaining attempts
- Locked accounts show time remaining
- Clear guidance for users

## Monitoring

### Check Login Attempts (Python)
```python
from backend import auth

# Check if account is locked
is_locked = auth.is_account_locked("username")

# Get failed attempts count
attempts = auth.get_failed_attempts_count("username")

# Get lockout time remaining (seconds)
remaining = auth.get_lockout_time_remaining("username")
```

### Manual Unlock
To manually unlock an account, restart the server or implement an admin endpoint to clear login attempts.

## Migration from Old System

The new security system is backward compatible. Existing users can continue logging in without any changes. The enhanced security features activate automatically.

## Limitations

### In-Memory Storage
Currently, login attempts are stored in memory. This means:
- ✅ Fast and simple
- ✅ No database overhead
- ❌ Resets on server restart
- ❌ Not suitable for multi-server deployments

### Production Recommendation
For production environments with multiple servers, consider:
- Using Redis for distributed rate limiting
- Storing login attempts in the database
- Implementing session management

## Future Enhancements

Consider implementing:
1. **Two-Factor Authentication (2FA)**
2. **Email notifications for suspicious activity**
3. **CAPTCHA after multiple failed attempts**
4. **Session management and revocation**
5. **Audit logging to database**
6. **IP whitelisting/blacklisting**
7. **Geolocation-based access control**

## Testing

### Test Account Lockout
```bash
# Attempt login 5 times with wrong password
for i in {1..5}; do
  curl -X POST http://localhost:30815/api/token \
    -d "username=testuser&password=wrongpassword"
done

# 6th attempt should return 423 Locked
curl -X POST http://localhost:30815/api/token \
  -d "username=testuser&password=wrongpassword"
```

### Test Rate Limiting
```bash
# Make 10+ rapid requests from same IP
for i in {1..12}; do
  curl -X POST http://localhost:30815/api/token \
    -d "username=user$i&password=wrong"
done

# Should eventually return 429 Too Many Requests
```

## Support

For security issues or questions:
1. Review this documentation
2. Check environment variables
3. Monitor server logs
4. Test with curl or Postman

## Security Disclosure

If you discover a security vulnerability, please:
1. Do NOT create a public issue
2. Contact the administrator directly
3. Provide detailed information
4. Allow time for a fix before disclosure

---

**Status**: ✅ Enhanced Security Active
**Version**: 2.0
**Last Updated**: 2025-12-02
