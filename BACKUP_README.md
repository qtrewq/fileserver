# FileServer Backup System

This backup system creates timestamped backups of your FileServer application, including:
- Database files (*.db)
- Backend Python code
- Frontend React code
- Configuration files
- All uploaded user files

## Quick Start

### Option 1: Double-Click Backup (Windows)
Simply double-click `backup.bat` to create a backup with default settings.

### Option 2: Command Line

```bash
# Create a compressed backup (default)
python backup.py

# Create an uncompressed folder backup
python backup.py --no-compress

# List all existing backups
python backup.py --list

# Keep only 5 most recent backups
python backup.py --keep 5

# Backup to a custom location
python backup.py --backup-dir "D:/MyBackups"
```

## Default Settings

- **Backup Location**: `I:/fileserver_backups/`
- **Format**: Compressed ZIP file
- **Naming**: `fileserver_backup_YYYYMMDD_HHMMSS.zip`
- **Retention**: Keeps 10 most recent backups (older ones are automatically deleted)

## Customization

Edit `backup.py` to change:
- `BACKUP_BASE_DIR`: Change the default backup location
- `INCLUDE_PATTERNS`: Add/remove file patterns to backup
- `EXCLUDE_PATTERNS`: Add/remove file patterns to exclude

## What Gets Backed Up

✅ **Included:**
- All backend Python files
- All frontend source code
- Database files (*.db)
- Configuration files (*.json, *.yml, *.yaml)
- Documentation (*.md, *.txt)
- Package files (requirements.txt, package.json)

❌ **Excluded:**
- Python cache files (`__pycache__`, `*.pyc`)
- Node modules (`node_modules/`)
- Build artifacts (`dist/`, `build/`)
- Virtual environments (`venv/`, `.venv/`)
- Git files (`.git/`)
- IDE files (`.vscode/`, `.idea/`)
- Log files (`*.log`)

## Scheduled Backups

### Windows Task Scheduler

1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (e.g., Daily at 2:00 AM)
4. Action: Start a program
   - Program: `python`
   - Arguments: `backup.py`
   - Start in: `I:\fileserver`

### Linux/Mac Cron Job

```bash
# Edit crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * cd /path/to/fileserver && python backup.py
```

## Restoring from Backup

### From ZIP Backup:
1. Extract the ZIP file to a temporary location
2. Copy the files you need to restore
3. For database: Replace `fileserver.db` with the backup version
4. Restart the server

### From Folder Backup:
1. Copy the files you need from the backup folder
2. Replace the corresponding files in your fileserver directory
3. Restart the server

## Command Line Options

```
usage: backup.py [-h] [--backup-dir BACKUP_DIR] [--no-compress] 
                 [--keep KEEP] [--list] [--no-cleanup]

optional arguments:
  -h, --help            Show this help message and exit
  --backup-dir BACKUP_DIR
                        Backup directory (default: I:/fileserver_backups)
  --no-compress         Create folder backup instead of zip file
  --keep KEEP           Number of recent backups to keep (default: 10)
  --list                List existing backups
  --no-cleanup          Skip cleanup of old backups
```

## Examples

```bash
# Create backup and keep only 3 most recent
python backup.py --keep 3

# Create uncompressed backup to external drive
python backup.py --no-compress --backup-dir "E:/Backups"

# Create backup without deleting old ones
python backup.py --no-cleanup

# View all existing backups
python backup.py --list
```

## Troubleshooting

**Backup fails with permission error:**
- Make sure the backup directory is writable
- Run as administrator if backing up to system directories

**Backup is too large:**
- Check if `node_modules/` is being excluded
- Verify `dist/` and `build/` folders are excluded
- Consider using compressed backups (default)

**Can't find old backups:**
- Use `python backup.py --list` to see all backups
- Check the backup directory path in the script

## Best Practices

1. **Regular Backups**: Schedule daily backups automatically
2. **Multiple Locations**: Backup to both local and external drives
3. **Test Restores**: Periodically test restoring from backups
4. **Off-site Backups**: Copy important backups to cloud storage
5. **Before Updates**: Always backup before major updates or changes
