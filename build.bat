@echo off
echo ============================================================
echo FileServer - Building Standalone Executable
echo ============================================================
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if errorlevel 1 (
    echo WARNING: Node.js not found. Frontend may not be up to date.
    echo Please install Node.js to build the frontend.
    echo.
) else (
    echo Step 1: Building frontend...
    echo.
    cd frontend
    
    REM Check if node_modules exists
    if not exist "node_modules" (
        echo Installing frontend dependencies...
        call npm install
        if errorlevel 1 (
            echo ERROR: Failed to install frontend dependencies
            cd ..
            pause
            exit /b 1
        )
    )
    
    echo Building frontend production bundle...
    call npm run build
    if errorlevel 1 (
        echo ERROR: Frontend build failed
        cd ..
        pause
        exit /b 1
    )
    
    cd ..
    echo Frontend build complete!
    echo.
)

REM Check if PyInstaller is installed
echo Step 2: Checking Python dependencies...
python -c "import PyInstaller" 2>nul
if errorlevel 1 (
    echo Installing PyInstaller...
    pip install pyinstaller
    if errorlevel 1 (
        echo ERROR: Failed to install PyInstaller
        pause
        exit /b 1
    )
    echo.
)

REM Check other Python dependencies
echo Checking required Python packages...
python -c "import fastapi, uvicorn, sqlalchemy, passlib, jose" 2>nul
if errorlevel 1 (
    echo Installing Python dependencies...
    pip install -r requirements.txt
    if errorlevel 1 (
        echo ERROR: Failed to install Python dependencies
        pause
        exit /b 1
    )
    echo.
)

echo Step 3: Building executable...
echo This may take a few minutes...
echo.

REM Clean previous build
if exist "build" rmdir /s /q "build"
if exist "dist\FileServer.exe" del /q "dist\FileServer.exe"

python -m PyInstaller fileserver.spec --clean

if errorlevel 1 (
    echo.
    echo ============================================================
    echo BUILD FAILED
    echo ============================================================
    echo.
    echo Please check the error messages above.
    echo Common issues:
    echo   - Missing Python packages (run: pip install -r requirements.txt)
    echo   - Frontend not built (run: cd frontend ^&^& npm install ^&^& npm run build)
    echo   - PyInstaller issues (try: pip install --upgrade pyinstaller)
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo BUILD SUCCESSFUL
echo ============================================================
echo.
echo The executable has been created in the 'dist' folder:
dir /b dist\FileServer.exe 2>nul
echo.
echo File size:
for %%A in (dist\FileServer.exe) do echo   %%~zA bytes
echo.
echo To run the application:
echo   1. Double-click dist\FileServer.exe
echo   2. Or run from command line: dist\FileServer.exe
echo.
echo The server will start on: http://localhost:30815
echo Default credentials: admin / adminpassword
echo.
echo IMPORTANT: Change the admin password on first login!
echo.
echo ============================================================
echo.
pause
