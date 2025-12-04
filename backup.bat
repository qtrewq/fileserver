@echo off
REM Quick backup script for FileServer
REM Double-click this file to create a backup

echo ========================================
echo FileServer Quick Backup
echo ========================================
echo.

python backup.py

echo.
echo Press any key to exit...
pause >nul
