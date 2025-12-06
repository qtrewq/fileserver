# Creating GitHub Release for FileServer v1.0.0

## Automated Method (Recommended)

### Using GitHub CLI:

1. **Install GitHub CLI** (if not already installed):
   - Download from: https://cli.github.com/
   - Or use: `winget install --id GitHub.cli`

2. **Authenticate with GitHub**:
   ```bash
   gh auth login
   ```

3. **Create the release**:
   ```bash
   gh release create v1.0.0 ^
     --title "FileServer v1.0.0 - Initial Release" ^
     --notes-file RELEASE_NOTES.md ^
     dist/FileServer.exe
   ```

## Manual Method

### Via GitHub Web Interface:

1. **Go to your repository**: https://github.com/qtrewq/fileserver

2. **Navigate to Releases**:
   - Click on "Releases" in the right sidebar
   - Or go to: https://github.com/qtrewq/fileserver/releases

3. **Create a new release**:
   - Click "Draft a new release"
   - Choose tag: `v1.0.0`
   - Release title: `FileServer v1.0.0 - Initial Release`
   - Description: Copy content from `RELEASE_NOTES.md`

4. **Upload the executable**:
   - Drag and drop `dist/FileServer.exe` to the "Attach binaries" section
   - Or click "Attach binaries by dropping them here or selecting them"

5. **Publish**:
   - Check "Set as the latest release"
   - Click "Publish release"

## Release Assets

The following file should be attached to the release:
- `FileServer.exe` (~16MB) - Standalone Windows executable

## Release Information

- **Version**: v1.0.0
- **Tag**: v1.0.0
- **Branch**: main
- **Commit**: f146927 (latest)

## Post-Release

After creating the release:
1. Verify the release is visible at: https://github.com/qtrewq/fileserver/releases
2. Test downloading the executable
3. Verify the download works correctly
4. Update any documentation links if needed

## Notes

- The tag `v1.0.0` has already been created and pushed
- All code changes have been committed and pushed to main
- The executable is located at: `dist/FileServer.exe`
- Release notes are in: `RELEASE_NOTES.md`
