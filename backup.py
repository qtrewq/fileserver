"""
Backup script for FileServer application
Creates timestamped backups of the entire project including database, code, and uploaded files
"""

import os
import shutil
import datetime
import zipfile
from pathlib import Path

# Configuration
SOURCE_DIR = Path(__file__).parent.absolute()
BACKUP_BASE_DIR = Path("I:/fileserver_backups")  # Change this to your preferred backup location
# Alternative backup locations (uncomment and modify as needed):
# BACKUP_BASE_DIR = Path("D:/Backups/fileserver")
# BACKUP_BASE_DIR = Path(os.path.expanduser("~/Documents/fileserver_backups"))

# What to backup
INCLUDE_PATTERNS = [
    "backend/**/*",
    "frontend/**/*",
    "*.db",
    "*.py",
    "*.md",
    "*.txt",
    "*.json",
    "*.yml",
    "*.yaml",
    "requirements.txt",
    "package.json",
    "package-lock.json",
]

# What to exclude
EXCLUDE_PATTERNS = [
    "**/__pycache__/**",
    "**/*.pyc",
    "**/node_modules/**",
    "**/dist/**",
    "**/build/**",
    "**/.venv/**",
    "**/venv/**",
    "**/.git/**",
    "**/.vscode/**",
    "**/.idea/**",
    "**/fileserver_backups/**",
    "**/*.log",
]


def should_include(file_path: Path, source_dir: Path) -> bool:
    """Check if a file should be included in the backup"""
    relative_path = file_path.relative_to(source_dir)
    
    # Check exclusions first
    for pattern in EXCLUDE_PATTERNS:
        if relative_path.match(pattern):
            return False
    
    # Check inclusions
    for pattern in INCLUDE_PATTERNS:
        if relative_path.match(pattern) or file_path.name == pattern:
            return True
    
    return False


def create_backup(backup_dir: Path, compress: bool = True) -> Path:
    """
    Create a backup of the fileserver application
    
    Args:
        backup_dir: Directory where backups will be stored
        compress: If True, create a zip file; if False, create a folder
    
    Returns:
        Path to the created backup
    """
    # Create backup directory if it doesn't exist
    backup_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate timestamp
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_name = f"fileserver_backup_{timestamp}"
    
    if compress:
        backup_path = backup_dir / f"{backup_name}.zip"
        print(f"Creating compressed backup: {backup_path}")
        
        with zipfile.ZipFile(backup_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            file_count = 0
            for root, dirs, files in os.walk(SOURCE_DIR):
                root_path = Path(root)
                
                for file in files:
                    file_path = root_path / file
                    
                    if should_include(file_path, SOURCE_DIR):
                        arcname = file_path.relative_to(SOURCE_DIR)
                        zipf.write(file_path, arcname)
                        file_count += 1
                        if file_count % 100 == 0:
                            print(f"  Backed up {file_count} files...")
            
            print(f"  Total files backed up: {file_count}")
    else:
        backup_path = backup_dir / backup_name
        print(f"Creating folder backup: {backup_path}")
        backup_path.mkdir(parents=True, exist_ok=True)
        
        file_count = 0
        for root, dirs, files in os.walk(SOURCE_DIR):
            root_path = Path(root)
            
            for file in files:
                file_path = root_path / file
                
                if should_include(file_path, SOURCE_DIR):
                    relative_path = file_path.relative_to(SOURCE_DIR)
                    dest_path = backup_path / relative_path
                    dest_path.parent.mkdir(parents=True, exist_ok=True)
                    shutil.copy2(file_path, dest_path)
                    file_count += 1
                    if file_count % 100 == 0:
                        print(f"  Backed up {file_count} files...")
        
        print(f"  Total files backed up: {file_count}")
    
    # Get backup size
    if compress:
        size_mb = backup_path.stat().st_size / (1024 * 1024)
    else:
        size_mb = sum(f.stat().st_size for f in backup_path.rglob('*') if f.is_file()) / (1024 * 1024)
    
    print(f"  Backup size: {size_mb:.2f} MB")
    print(f"✓ Backup completed successfully!")
    
    return backup_path


def cleanup_old_backups(backup_dir: Path, keep_count: int = 10):
    """
    Remove old backups, keeping only the most recent ones
    
    Args:
        backup_dir: Directory containing backups
        keep_count: Number of recent backups to keep
    """
    if not backup_dir.exists():
        return
    
    # Get all backup files and folders
    backups = []
    for item in backup_dir.iterdir():
        if item.name.startswith("fileserver_backup_"):
            backups.append(item)
    
    # Sort by modification time (newest first)
    backups.sort(key=lambda x: x.stat().st_mtime, reverse=True)
    
    # Remove old backups
    if len(backups) > keep_count:
        print(f"\nCleaning up old backups (keeping {keep_count} most recent)...")
        for old_backup in backups[keep_count:]:
            print(f"  Removing: {old_backup.name}")
            if old_backup.is_file():
                old_backup.unlink()
            else:
                shutil.rmtree(old_backup)
        print(f"✓ Cleanup completed!")


def list_backups(backup_dir: Path):
    """List all available backups"""
    if not backup_dir.exists():
        print(f"No backups found in {backup_dir}")
        return
    
    backups = []
    for item in backup_dir.iterdir():
        if item.name.startswith("fileserver_backup_"):
            if item.is_file():
                size_mb = item.stat().st_size / (1024 * 1024)
            else:
                size_mb = sum(f.stat().st_size for f in item.rglob('*') if f.is_file()) / (1024 * 1024)
            
            mtime = datetime.datetime.fromtimestamp(item.stat().st_mtime)
            backups.append((item.name, mtime, size_mb, item.is_file()))
    
    if not backups:
        print(f"No backups found in {backup_dir}")
        return
    
    backups.sort(key=lambda x: x[1], reverse=True)
    
    print(f"\nAvailable backups in {backup_dir}:")
    print("-" * 80)
    for name, mtime, size_mb, is_compressed in backups:
        backup_type = "ZIP" if is_compressed else "FOLDER"
        print(f"{name:45} {mtime.strftime('%Y-%m-%d %H:%M:%S')}  {size_mb:8.2f} MB  [{backup_type}]")
    print("-" * 80)
    print(f"Total: {len(backups)} backup(s)")


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Backup FileServer application")
    parser.add_argument(
        "--backup-dir",
        type=str,
        default=str(BACKUP_BASE_DIR),
        help=f"Backup directory (default: {BACKUP_BASE_DIR})"
    )
    parser.add_argument(
        "--no-compress",
        action="store_true",
        help="Create folder backup instead of zip file"
    )
    parser.add_argument(
        "--keep",
        type=int,
        default=10,
        help="Number of recent backups to keep (default: 10)"
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List existing backups"
    )
    parser.add_argument(
        "--no-cleanup",
        action="store_true",
        help="Skip cleanup of old backups"
    )
    
    args = parser.parse_args()
    
    backup_dir = Path(args.backup_dir)
    
    if args.list:
        list_backups(backup_dir)
    else:
        print("=" * 80)
        print("FileServer Backup Script")
        print("=" * 80)
        print(f"Source: {SOURCE_DIR}")
        print(f"Destination: {backup_dir}")
        print(f"Compress: {not args.no_compress}")
        print("=" * 80)
        print()
        
        try:
            backup_path = create_backup(backup_dir, compress=not args.no_compress)
            
            if not args.no_cleanup:
                cleanup_old_backups(backup_dir, keep_count=args.keep)
            
            print(f"\n✓ Backup saved to: {backup_path}")
            
        except Exception as e:
            print(f"\n✗ Backup failed: {e}")
            import traceback
            traceback.print_exc()
            exit(1)
