@echo off
echo ============================================================
echo FileServer - Building Installer
echo ============================================================
echo.

REM Check if Inno Setup is installed
set ISCC="C:\Program Files (x86)\Inno Setup 6\ISCC.exe"
if not exist %ISCC% (
    echo ERROR: Inno Setup not found!
    echo.
    echo Please download and install Inno Setup from:
    echo https://jrsoftware.org/isdl.php
    echo.
    echo After installation, run this script again.
    echo.
    pause
    exit /b 1
)

REM Check if executable exists
if not exist "dist\FileServer.exe" (
    echo ERROR: FileServer.exe not found in dist folder!
    echo.
    echo Please build the executable first:
    echo   python -m PyInstaller fileserver.spec --clean
    echo.
    pause
    exit /b 1
)

echo Building installer...
echo.

REM Create output directory
if not exist "installer_output" mkdir installer_output

REM Build the installer
%ISCC% installer.iss

if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED
    echo ============================================================
    pause
    exit /b 1
)

echo.
echo ============================================================
echo BUILD SUCCESSFUL
echo ============================================================
echo.
echo The installer has been created in the 'installer_output' folder:
dir /b installer_output\*.exe
echo.
echo You can now distribute this installer to users.
echo Users just need to run the installer - no other dependencies required!
echo.
echo ============================================================
echo.
pause
