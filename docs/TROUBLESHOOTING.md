# Troubleshooting Guide

Common issues and how to fix them.

## Connection Issues

### "Site can't be reached" / Connection Refused
- **Server not running**: Check the console window. If it closed, run `run.bat` again.
- **Wrong URL**: Ensure you are using `http://localhost:30815`. If accessing from another device, use the server's LAN IP (e.g., `192.168.1.10:30815`).
- **Firewall**: Windows Firewall might block incoming connections. Allow the port `30815`.

### Port 30815 is already in use
The server console says `Address already in use`.
1. Open Task Manager.
2. Look for existing `FileServer.exe` or `python.exe` processes.
3. End them.
4. Try again.

---

## Login Issues

### "Invalid Credentials"
- Default is `admin` / `adminpassword`.
- If you changed it and forgot, you need to reset the database (see below).

### "Account Disabled"
- Ask an administrator to re-enable your account.

---

## File Issues

### Upload Fails
- **File too large**: Check Admin Settings > Security > Max File Size.
- **Quota Exceeded**: Your user account has run out of storage space. Ask an admin to increase it.
- **Permission Denied**: You might be trying to upload to a read-only shared folder.

### "Database Locked" Error
- This happens if two processes try to write to `fileserver.db` at the exact same instant (rare with SQLite).
- **Fix**: Restart the server.

---

## Resetting the Application

**WARNING**: This will delete all users and settings (but NOT your uploaded files).

1. Stop the server.
2. Go to the project folder.
3. Delete `fileserver.db`.
4. Start the server.
5. A new database will be created with the default `admin` user.
