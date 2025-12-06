@echo off
echo ============================================================
echo FileServer - Starting with correct storage path
echo ============================================================
echo.

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
