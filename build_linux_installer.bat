@echo off
echo ============================================================
echo FileServer - Building Linux Installer Package
echo ============================================================
echo.

REM Check if tar is available (Windows 10+ has built-in tar)
where tar >nul 2>nul
if errorlevel 1 (
    echo ERROR: tar command not found!
    echo.
    echo Windows 10 and later include tar by default.
    echo If you're on an older version, please install Git for Windows
    echo or use WSL to create the Linux package.
    echo.
    pause
    exit /b 1
)

REM Create temporary packaging directory
set PACKAGE_NAME=fileserver-linux-1.1.0
set TEMP_DIR=temp_linux_package
set OUTPUT_DIR=installer_output

echo Creating package directory structure...
echo.

REM Clean up any existing temp directory
if exist "%TEMP_DIR%" rmdir /s /q "%TEMP_DIR%"
mkdir "%TEMP_DIR%\%PACKAGE_NAME%"

REM Create output directory
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"

echo Copying application files...
echo.

REM Copy main documentation
copy README.md "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy LICENSE "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy LICENSE.txt "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul

REM Copy Python source files
copy launcher.py "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy requirements.txt "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy diagnose_storage.py "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy test_file_save.py "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul

REM Copy PyInstaller spec files
copy fileserver.spec "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy fileserver-linux.spec "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul

REM Copy Linux scripts
copy build-linux.sh "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy install-linux.sh "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy run-linux.sh "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul

REM Copy Docker files
copy Dockerfile "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy docker-compose.yml "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy .dockerignore "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul

REM Copy configuration files
copy .gitignore "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul
copy .env.example "%TEMP_DIR%\%PACKAGE_NAME%\" >nul 2>nul

REM Copy backend directory (excluding __pycache__)
echo Copying backend files...
xcopy backend "%TEMP_DIR%\%PACKAGE_NAME%\backend\" /E /I /Q /EXCLUDE:exclude_list.tmp >nul 2>nul
if not exist exclude_list.tmp (
    echo __pycache__ > exclude_list.tmp
    echo *.pyc >> exclude_list.tmp
    echo *.pyo >> exclude_list.tmp
    xcopy backend "%TEMP_DIR%\%PACKAGE_NAME%\backend\" /E /I /Q /EXCLUDE:exclude_list.tmp >nul
    del exclude_list.tmp
) else (
    xcopy backend "%TEMP_DIR%\%PACKAGE_NAME%\backend\" /E /I /Q /EXCLUDE:exclude_list.tmp >nul
    del exclude_list.tmp
)

REM Copy frontend directory (excluding node_modules)
echo Copying frontend files...
mkdir "%TEMP_DIR%\%PACKAGE_NAME%\frontend"
xcopy frontend "%TEMP_DIR%\%PACKAGE_NAME%\frontend\" /E /I /Q /EXCLUDE:exclude_frontend.tmp >nul 2>nul
if not exist exclude_frontend.tmp (
    echo node_modules > exclude_frontend.tmp
    echo package-lock.json >> exclude_frontend.tmp
    echo *.log >> exclude_frontend.tmp
    echo __pycache__ >> exclude_frontend.tmp
    xcopy frontend "%TEMP_DIR%\%PACKAGE_NAME%\frontend\" /E /I /Q /EXCLUDE:exclude_frontend.tmp >nul
    del exclude_frontend.tmp
) else (
    xcopy frontend "%TEMP_DIR%\%PACKAGE_NAME%\frontend\" /E /I /Q /EXCLUDE:exclude_frontend.tmp >nul
    del exclude_frontend.tmp
)

REM Create empty storage directory
mkdir "%TEMP_DIR%\%PACKAGE_NAME%\storage" >nul 2>nul
echo. > "%TEMP_DIR%\%PACKAGE_NAME%\storage\.gitkeep"

REM Create installation instructions
echo Creating INSTALL.txt...
(
echo ============================================================
echo FileServer - Linux Installation Instructions
echo ============================================================
echo.
echo INSTALLATION METHODS:
echo.
echo METHOD 1: Automated Installation ^(Recommended^)
echo ------------------------------------------------
echo 1. Extract this package:
echo    tar -xzf fileserver-linux-1.1.0.tar.gz
echo    cd fileserver-linux-1.1.0
echo.
echo 2. Run the installation script as root:
echo    sudo bash install-linux.sh
echo.
echo 3. Start the service:
echo    sudo systemctl start fileserver
echo    sudo systemctl enable fileserver
echo.
echo METHOD 2: Manual Installation
echo ------------------------------
echo 1. Install Python 3.8+ and pip
echo 2. Install dependencies:
echo    pip3 install -r requirements.txt
echo.
echo 3. Install frontend dependencies:
echo    cd frontend
echo    npm install
echo    npm run build
echo    cd ..
echo.
echo 4. Run the application:
echo    python3 launcher.py
echo.
echo METHOD 3: Docker Installation
echo ------------------------------
echo 1. Build and run with Docker Compose:
echo    docker-compose up -d
echo.
echo ACCESS THE APPLICATION:
echo -----------------------
echo Default URL: http://localhost:30815
echo Default credentials: admin / adminpassword
echo.
echo IMPORTANT: Change the default password after first login!
echo.
echo For more information, see README.md
echo ============================================================
) > "%TEMP_DIR%\%PACKAGE_NAME%\INSTALL.txt"

echo Creating tarball package...
echo.

REM Create tarball using Windows built-in tar
cd "%TEMP_DIR%"
tar -czf "..\%OUTPUT_DIR%\%PACKAGE_NAME%.tar.gz" "%PACKAGE_NAME%"
cd ..

if errorlevel 1 (
    echo.
    echo ============================================================
    echo PACKAGING FAILED
    echo ============================================================
    rmdir /s /q "%TEMP_DIR%"
    pause
    exit /b 1
)

REM Clean up temporary directory
echo Cleaning up...
rmdir /s /q "%TEMP_DIR%"

echo.
echo ============================================================
echo BUILD SUCCESSFUL
echo ============================================================
echo.
echo The Linux installer package has been created:
dir /b "%OUTPUT_DIR%\%PACKAGE_NAME%.tar.gz"
echo.
echo Package location: %OUTPUT_DIR%\%PACKAGE_NAME%.tar.gz
echo.
echo This package can be transferred to any Linux system and installed.
echo See INSTALL.txt inside the package for installation instructions.
echo.
echo Package contents:
echo   - Application source code
echo   - Installation scripts
echo   - Docker configuration
echo   - Frontend source
echo   - Backend source
echo   - Documentation
echo.
echo NOTE: Users will need Python 3.8+ and Node.js to run from source,
echo       or Docker to run in a container.
echo.
echo ============================================================
echo.
pause
