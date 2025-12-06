# FileServer Installer Guide

## Overview

The FileServer installer is a professional Windows installer that makes installation simple for end users. No technical knowledge required - just download and run!

## What the Installer Does

1. **Installs the Application**
   - Copies FileServer.exe to Program Files
   - Creates Start Menu shortcuts
   - Optionally creates Desktop shortcut

2. **Sets Up Data Directory**
   - Lets user choose where to store files
   - Creates the storage directory automatically
   - Configures the application to use the selected location

3. **Creates Launch Script**
   - Generates a run.bat file with correct settings
   - Sets STORAGE_ROOT environment variable
   - Provides easy way to start the server

4. **Provides Uninstaller**
   - Clean removal of all installed files
   - Removes shortcuts
   - Preserves user data (optional)

## Building the Installer

### Prerequisites

1. **Inno Setup** (Free)
   - Download from: https://jrsoftware.org/isdl.php
   - Install with default settings
   - Version 6.x recommended

2. **Built Executable**
   - Must have `dist/FileServer.exe` ready
   - Build with: `python -m PyInstaller fileserver.spec --clean`

### Build Steps

#### Option 1: Using Build Script (Easiest)
```bash
build_installer.bat
```

#### Option 2: Manual Build
```bash
"C:\Program Files (x86)\Inno Setup 6\ISCC.exe" installer.iss
```

### Output

The installer will be created in `installer_output/`:
- **Filename**: `FileServer-Setup-1.0.0.exe`
- **Size**: ~30-35 MB
- **Type**: Windows Installer

## Installer Features

### User Experience
- **Modern Wizard Interface** - Clean, professional installation wizard
- **Custom Data Directory** - User chooses where to store files
- **Desktop Icon** - Optional desktop shortcut
- **Start Menu Integration** - Easy access from Start Menu
- **Uninstaller** - Clean removal option

### Technical Features
- **64-bit Support** - Optimized for x64 Windows
- **Admin Privileges** - Installs to Program Files (requires admin)
- **LZMA2 Compression** - Maximum compression for smaller download
- **Version Information** - Proper version tracking
- **Upgrade Support** - Can upgrade existing installations

## Installation Process (End User)

1. **Download** `FileServer-Setup-1.0.0.exe`
2. **Run** the installer (requires admin rights)
3. **Follow** the installation wizard:
   - Accept license
   - Choose installation directory (default: C:\Program Files\FileServer)
   - Choose data directory (default: C:\Program Files\FileServer\storage)
   - Select shortcuts
4. **Launch** FileServer from Start Menu or Desktop
5. **Access** at http://localhost:30815

## Files Included in Installer

- `FileServer.exe` - Main application (~28.6 MB)
- `README_EXECUTABLE.md` - User documentation
- `RELEASE_NOTES.md` - Version information
- `run.bat` - Auto-generated launch script

## Customization

### Changing App Details
Edit `installer.iss`:
```pascal
#define MyAppName "FileServer"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "Your Name"
#define MyAppURL "https://your-url.com"
```

### Adding Files
Add to `[Files]` section:
```pascal
Source: "path\to\file"; DestDir: "{app}"; Flags: ignoreversion
```

### Changing Default Directories
Edit in `[Setup]` section:
```pascal
DefaultDirName={autopf}\{#MyAppName}
```

## Distribution

### Release Package
The installer is ready for distribution:
- Upload to GitHub Releases
- Share via download link
- Distribute on USB drives
- Deploy via network

### File Naming
- **Development**: `FileServer-Setup-1.0.0.exe`
- **Production**: Consider adding build date or commit hash

## Troubleshooting

### Inno Setup Not Found
- Install from: https://jrsoftware.org/isdl.php
- Verify installation path in `build_installer.bat`

### Executable Not Found
- Build the executable first: `python -m PyInstaller fileserver.spec --clean`
- Ensure `dist/FileServer.exe` exists

### Installer Build Fails
- Check `installer.iss` syntax
- Verify all source files exist
- Check Inno Setup compiler output

### Installation Fails
- Run as Administrator
- Check disk space
- Verify Windows version (Windows 10+)

## Advanced Features

### Silent Installation
```bash
FileServer-Setup-1.0.0.exe /SILENT
```

### Very Silent (No UI)
```bash
FileServer-Setup-1.0.0.exe /VERYSILENT
```

### Custom Install Directory
```bash
FileServer-Setup-1.0.0.exe /DIR="C:\MyCustomPath"
```

### Unattended Installation
```bash
FileServer-Setup-1.0.0.exe /SILENT /SUPPRESSMSGBOXES /NORESTART
```

## Security

- **Code Signing**: Consider signing the installer for production
- **Checksum**: Provide SHA256 hash for verification
- **HTTPS**: Distribute via secure channels

## Support

For issues with the installer:
1. Check this documentation
2. Review Inno Setup documentation
3. Check GitHub Issues
4. Contact support

## License

The installer script is provided under the same license as FileServer (MIT).

---

**Ready to distribute!** The installer provides a professional, user-friendly installation experience for FileServer.
