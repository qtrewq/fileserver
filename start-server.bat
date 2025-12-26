@echo off
echo ============================================================
echo FileServer - Starting with correct storage path
echo ============================================================
echo.

REM Stop any existing server instance on port 30815
echo Checking for existing server instance...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr ":30815" ^| findstr "LISTENING" 2^>nul') do (
    echo Found existing server, stopping it...
    taskkill /F /PID %%a >nul 2>&1
    timeout /t 1 /nobreak >nul
)

REM Set the storage root to the current directory's storage folder
set STORAGE_ROOT=%~dp0storage

echo Storage directory: %STORAGE_ROOT%
echo Server URL: http://localhost:30815
echo.
echo Press CTRL+C to stop the server
echo ============================================================
echo.

REM Start the server
python -m uvicorn backend.main:app --host 0.0.0.0 --port 30815
