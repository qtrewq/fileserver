; FileServer Installer Script for Inno Setup
; Download Inno Setup from: https://jrsoftware.org/isdl.php

#define MyAppName "FileServer"
#define MyAppVersion "1.1.0"
#define MyAppPublisher "FileServer Team"
#define MyAppURL "https://github.com/qtrewq/fileserver"
#define MyAppExeName "FileServer.exe"

[Setup]
; NOTE: The value of AppId uniquely identifies this application.
AppId={{A8B9C0D1-E2F3-4A5B-6C7D-8E9F0A1B2C3D}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
AppSupportURL={#MyAppURL}
AppUpdatesURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
AllowNoIcons=yes
LicenseFile=LICENSE.txt
OutputDir=installer_output
OutputBaseFilename=FileServer-Setup-{#MyAppVersion}
Compression=lzma2/max
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=admin
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible

[Languages]
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked
Name: "quicklaunchicon"; Description: "{cm:CreateQuickLaunchIcon}"; GroupDescription: "{cm:AdditionalIcons}"; Flags: unchecked; OnlyBelowVersion: 6.1; Check: not IsAdminInstallMode

[Files]
; Main executable
Source: "dist\{#MyAppExeName}"; DestDir: "{app}"; Flags: ignoreversion

; Documentation Files
Source: "README.md"; DestDir: "{app}"; Flags: ignoreversion
Source: "EMAIL_SETUP.md"; DestDir: "{app}"; Flags: ignoreversion

; License files
Source: "LICENSE"; DestDir: "{app}"; Flags: ignoreversion
Source: "LICENSE.txt"; DestDir: "{app}"; Flags: ignoreversion

; Python source files
Source: "launcher.py"; DestDir: "{app}"; Flags: ignoreversion
Source: "requirements.txt"; DestDir: "{app}"; Flags: ignoreversion

; NOTE: Exclude user database - users will create their own
; Source: "fileserver.db"; DestDir: "{app}"; Flags: ignoreversion

; PyInstaller spec files
Source: "fileserver.spec"; DestDir: "{app}"; Flags: ignoreversion
Source: "fileserver-linux.spec"; DestDir: "{app}"; Flags: ignoreversion

; Windows batch scripts
Source: "build.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "build_installer.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "run.bat"; DestDir: "{app}"; Flags: ignoreversion
Source: "start-server.bat"; DestDir: "{app}"; Flags: ignoreversion

; Linux shell scripts
Source: "build-linux.sh"; DestDir: "{app}"; Flags: ignoreversion
Source: "install-linux.sh"; DestDir: "{app}"; Flags: ignoreversion
Source: "run-linux.sh"; DestDir: "{app}"; Flags: ignoreversion

; Docker files
Source: "Dockerfile"; DestDir: "{app}"; Flags: ignoreversion
Source: "docker-compose.yml"; DestDir: "{app}"; Flags: ignoreversion
Source: ".dockerignore"; DestDir: "{app}"; Flags: ignoreversion; Attribs: hidden

; Configuration files
Source: ".gitignore"; DestDir: "{app}"; Flags: ignoreversion; Attribs: hidden
Source: ".env.example"; DestDir: "{app}"; Flags: ignoreversion; Attribs: hidden

; Backend directory (all Python files, excluding __pycache__)
Source: "backend\*"; DestDir: "{app}\backend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "__pycache__,*.pyc,*.pyo"

; Frontend directory (source and built files, excluding node_modules and build artifacts)
Source: "frontend\*"; DestDir: "{app}\frontend"; Flags: ignoreversion recursesubdirs createallsubdirs; Excludes: "node_modules,*.log,package-lock.json,__pycache__,*.pyc"

; Create empty storage directory structure (but don't include user files)
; The storage directory will be created by the installer but will be empty

; NOTE: Don't use "Flags: ignoreversion" on any shared system files

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"
Name: "{group}\{cm:UninstallProgram,{#MyAppName}}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: desktopicon
Name: "{userappdata}\Microsoft\Internet Explorer\Quick Launch\{#MyAppName}"; Filename: "{app}\{#MyAppExeName}"; Tasks: quicklaunchicon

[Run]
Filename: "{app}\{#MyAppExeName}"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[Code]
var
  DataDirPage: TInputDirWizardPage;

procedure InitializeWizard;
begin
  { Create custom page for data directory selection }
  DataDirPage := CreateInputDirPage(wpSelectDir,
    'Select Data Directory', 'Where should FileServer store user files?',
    'Select the folder where FileServer will store uploaded files and database, then click Next.',
    False, '');
  DataDirPage.Add('');
  DataDirPage.Values[0] := ExpandConstant('{autopf}\{#MyAppName}\storage');
end;

function GetDataDir(Param: String): String;
begin
  { Return the selected data directory }
  Result := DataDirPage.Values[0];
end;

procedure CurStepChanged(CurStep: TSetupStep);
var
  DataDir: String;
begin
  if CurStep = ssPostInstall then
  begin
    { Create data directory }
    DataDir := DataDirPage.Values[0];
    if not DirExists(DataDir) then
      CreateDir(DataDir);
    
    { Create a batch file to run the application with the correct data directory }
    SaveStringToFile(ExpandConstant('{app}\run.bat'), 
      '@echo off' + #13#10 +
      'echo ============================================================' + #13#10 +
      'echo FileServer - Secure File Management System' + #13#10 +
      'echo ============================================================' + #13#10 +
      'echo.' + #13#10 +
      'echo Starting server...' + #13#10 +
      'echo.' + #13#10 +
      'echo Server will be available at: http://localhost:30815' + #13#10 +
      'echo Data directory: ' + DataDir + #13#10 +
      'echo.' + #13#10 +
      'echo Press CTRL+C to stop the server' + #13#10 +
      'echo ============================================================' + #13#10 +
      'echo.' + #13#10 +
      'set STORAGE_ROOT=' + DataDir + #13#10 +
      '"%~dp0FileServer.exe"' + #13#10,
      False);
  end;
end;

[UninstallDelete]
Type: files; Name: "{app}\run.bat"
