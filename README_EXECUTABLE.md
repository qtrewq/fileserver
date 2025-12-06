# FileServer - Standalone Executable

## Quick Start

1. **Run the Application**
   - Simply double-click `FileServer.exe`
   - Or run from command line: `FileServer.exe`

2. **Access the Application**
   - Open your web browser
   - Navigate to: `http://localhost:30815`

3. **Login**
   - Default admin username: `admin`
   - Default admin password: `adminpassword`
   - **IMPORTANT**: Change the admin password immediately after first login!

## Features

- **Secure File Management**: Upload, download, and manage files with role-based permissions
- **Real-time Collaboration**: Multiple users can edit files simultaneously with live updates
- **File Sharing**: Share files and folders with other users
- **User Management**: Create users, assign permissions, and manage groups
- **Python Execution**: Run Python scripts directly in the browser
- **Auto-save**: Files automatically save as you type

## Storage Location

By default, all files are stored in the `storage` folder next to the executable.

## Stopping the Server

Press `CTRL+C` in the console window to stop the server.

## System Requirements

- Windows 10 or later
- Modern web browser (Chrome, Firefox, Edge)
- Port 30815 must be available

## Security Notes

1. **Change Default Password**: The default admin password should be changed immediately
2. **Firewall**: The server binds to `0.0.0.0`, making it accessible on your network
3. **HTTPS**: For production use, consider setting up a reverse proxy with HTTPS

## Troubleshooting

**Port Already in Use**
- If port 30815 is already in use, close the application using it
- Or modify the port in the launcher script

**Permission Errors**
- Run as Administrator if you encounter permission issues
- Ensure the storage folder is writable

**Cannot Access from Browser**
- Check if Windows Firewall is blocking the connection
- Verify the server started successfully (check console output)

## Building from Source

If you want to rebuild the executable:

1. Install dependencies: `pip install -r requirements.txt`
2. Build frontend: `cd frontend && npm install && npm run build`
3. Run build script: `build.bat`

The executable will be created in the `dist` folder.

## Support

For issues or questions, please refer to the project documentation.
