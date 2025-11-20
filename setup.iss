; Inno Setup Script для WallNux Messenger
; Скачай Inno Setup: https://jrsoftware.org/isdl.php

#define MyAppName "WallNux Messenger"
#define MyAppVersion "1.0.0"
#define MyAppPublisher "WallNux"
#define MyAppURL "https://wallnux.com"
#define MyAppExeName "chrome.exe"

[Setup]
AppId={{A1B2C3D4-E5F6-7890-ABCD-EF1234567890}
AppName={#MyAppName}
AppVersion={#MyAppVersion}
AppPublisher={#MyAppPublisher}
AppPublisherURL={#MyAppURL}
DefaultDirName={autopf}\{#MyAppName}
DefaultGroupName={#MyAppName}
DisableProgramGroupPage=yes
OutputDir=installer-output
OutputBaseFilename=WallNux-Messenger-Setup
Compression=lzma
SolidCompression=yes
WizardStyle=modern
PrivilegesRequired=lowest
ArchitecturesInstallIn64BitMode=x64

[Languages]
Name: "russian"; MessagesFile: "compiler:Languages\Russian.isl"
Name: "english"; MessagesFile: "compiler:Default.isl"

[Tasks]
Name: "desktopicon"; Description: "{cm:CreateDesktopIcon}"; GroupDescription: "{cm:AdditionalIcons}"
Name: "autostart"; Description: "Запускать при старте Windows"; GroupDescription: "Дополнительно:"

[Files]
; Копируем все файлы проекта
Source: "server.js"; DestDir: "{app}\server"; Flags: ignoreversion
Source: "database.js"; DestDir: "{app}\server"; Flags: ignoreversion
Source: "discord_clone.db"; DestDir: "{app}\server"; Flags: ignoreversion
Source: "package.json"; DestDir: "{app}\server"; Flags: ignoreversion
Source: "node_modules\*"; DestDir: "{app}\server\node_modules"; Flags: ignoreversion recursesubdirs createallsubdirs

; Копируем веб-файлы
Source: "index.html"; DestDir: "{app}\web"; Flags: ignoreversion
Source: "login.html"; DestDir: "{app}\web"; Flags: ignoreversion
Source: "*.css"; DestDir: "{app}\web"; Flags: ignoreversion
Source: "*.js"; DestDir: "{app}\web"; Flags: ignoreversion; Excludes: "server.js,database.js,electron-*.js,nw-*.js,obfuscate*.js"
Source: "assets\*"; DestDir: "{app}\web\assets"; Flags: ignoreversion recursesubdirs createallsubdirs

; Копируем Node.js (нужно скачать portable версию)
Source: "node-portable\*"; DestDir: "{app}\nodejs"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#MyAppName}"; Filename: "{app}\start.vbs"; IconFilename: "{app}\web\assets\icon.ico"
Name: "{autodesktop}\{#MyAppName}"; Filename: "{app}\start.vbs"; IconFilename: "{app}\web\assets\icon.ico"; Tasks: desktopicon

[Registry]
; Добавляем в автозагрузку
Root: HKCU; Subkey: "Software\Microsoft\Windows\CurrentVersion\Run"; ValueType: string; ValueName: "{#MyAppName}"; ValueData: """{app}\start.vbs"""; Flags: uninsdeletevalue; Tasks: autostart

[Code]
// Создаем VBS скрипт при установке
procedure CurStepChanged(CurStep: TSetupStep);
var
  VBSContent: TArrayOfString;
  VBSFile: String;
begin
  if CurStep = ssPostInstall then
  begin
    VBSFile := ExpandConstant('{app}\start.vbs');
    
    SetArrayLength(VBSContent, 20);
    VBSContent[0] := 'Set WshShell = CreateObject("WScript.Shell")';
    VBSContent[1] := 'Set fso = CreateObject("Scripting.FileSystemObject")';
    VBSContent[2] := '';
    VBSContent[3] := 'appPath = fso.GetParentFolderName(WScript.ScriptFullName)';
    VBSContent[4] := 'serverPath = appPath & "\server"';
    VBSContent[5] := 'nodePath = appPath & "\nodejs\node.exe"';
    VBSContent[6] := '';
    VBSContent[7] := ''' Проверяем запущен ли сервер';
    VBSContent[8] := 'On Error Resume Next';
    VBSContent[9] := 'Set objWMI = GetObject("winmgmts:")';
    VBSContent[10] := 'Set processes = objWMI.ExecQuery("SELECT * FROM Win32_Process WHERE Name = ''node.exe''")';
    VBSContent[11] := '';
    VBSContent[12] := 'serverRunning = (processes.Count > 0)';
    VBSContent[13] := '';
    VBSContent[14] := ''' Запускаем сервер если не запущен';
    VBSContent[15] := 'If Not serverRunning Then';
    VBSContent[16] := '    WshShell.Run "cmd /c cd /d """ & serverPath & """ && """ & nodePath & """ server.js", 0, False';
    VBSContent[17] := '    WScript.Sleep 3000';
    VBSContent[18] := 'End If';
    VBSContent[19] := '';
    VBSContent[20] := ''' Открываем в браузере';
    VBSContent[21] := 'WshShell.Run "http://localhost:3000/login.html"';
    
    SaveStringsToFile(VBSFile, VBSContent, False);
  end;
end;

[Run]
; Устанавливаем зависимости Node.js
Filename: "{app}\nodejs\node.exe"; Parameters: "npm install"; WorkingDir: "{app}\server"; StatusMsg: "Установка зависимостей..."; Flags: runhidden waituntilterminated

; Запускаем после установки
Filename: "{app}\start.vbs"; Description: "{cm:LaunchProgram,{#StringChange(MyAppName, '&', '&&')}}"; Flags: nowait postinstall skipifsilent

[UninstallRun]
; Останавливаем процессы при удалении
Filename: "taskkill"; Parameters: "/F /IM node.exe /T"; Flags: runhidden
Filename: "taskkill"; Parameters: "/F /IM chrome.exe /T"; Flags: runhidden
