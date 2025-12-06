@echo off
echo ============================================================
echo FileServer - Building Standalone Executable
echo ============================================================
echo.

REM Check if PyInstaller is installed
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
    echo.
)

echo Building executable...
echo This may take a few minutes...
echo.

pyinstaller fileserver.spec --clean

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
echo The executable has been created in the 'dist' folder:
echo   dist\FileServer.exe
echo.
echo To run the application, simply double-click FileServer.exe
echo or run it from the command line.
echo.
echo The server will start on: http://localhost:30815
echo ============================================================
echo.
pause
