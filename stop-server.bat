@echo off
setlocal enabledelayedexpansion

REM Default port for FileServer
set PORT=30815

REM Allow custom port as first argument
if not "%~1"=="" set PORT=%~1

echo ============================================================
echo FileServer - Stopping server on port %PORT%
echo ============================================================
echo.

REM Find the process ID using the specified port
echo Searching for process using port %PORT%...

set FOUND=0
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":%PORT%" ^| findstr "LISTENING"') do (
    set PID=%%a
    set FOUND=1
    echo Found process ID: %%a
    
    REM Get process name
    for /f "tokens=1" %%b in ('tasklist /FI "PID eq %%a" /NH 2^>nul') do (
        echo Process name: %%b
    )
    
    REM Kill the process
    echo Stopping process %%a...
    taskkill /F /PID %%a >nul 2>&1
    
    if !errorlevel! equ 0 (
        echo [SUCCESS] Process stopped successfully.
    ) else (
        echo [ERROR] Failed to stop process. You may need to run as Administrator.
    )
    echo.
)

REM Check if any process was found
if %FOUND%==0 (
    echo [INFO] No process found using port %PORT%
    echo The server may already be stopped.
)

echo ============================================================
echo Done.
echo ============================================================
pause
