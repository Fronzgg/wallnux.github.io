; WallNux Messenger Installer Script
; Использует NSIS (Nullsoft Scriptable Install System)

!define APP_NAME "WallNux Messenger"
!define APP_VERSION "1.0.0"
!define APP_PUBLISHER "WallNux"
!define APP_EXE "WallNux Messenger.exe"
!define SERVER_DIR "$APPDATA\WallNux\Server"
!define APP_DIR "$APPDATA\WallNux\App"

; Настройки установщика
Name "${APP_NAME}"
OutFile "WallNux-Messenger-Setup.exe"
InstallDir "$APPDATA\WallNux"
RequestExecutionLevel user

; Современный интерфейс
!include "MUI2.nsh"

; Страницы установщика
!insertmacro MUI_PAGE_WELCOME
!insertmacro MUI_PAGE_LICENSE "LICENSE.txt"
!insertmacro MUI_PAGE_DIRECTORY
!insertmacro MUI_PAGE_INSTFILES
!insertmacro MUI_PAGE_FINISH

; Страницы деинсталлятора
!insertmacro MUI_UNPAGE_CONFIRM
!insertmacro MUI_UNPAGE_INSTFILES

; Языки
!insertmacro MUI_LANGUAGE "Russian"
!insertmacro MUI_LANGUAGE "English"

; Секция установки
Section "Install"
    SetOutPath "$INSTDIR"
    
    ; Создаем скрытые папки
    CreateDirectory "${SERVER_DIR}"
    CreateDirectory "${APP_DIR}"
    
    ; Устанавливаем серверные файлы (скрыто)
    SetOutPath "${SERVER_DIR}"
    File "server.js"
    File "database.js"
    File "discord_clone.db"
    File /r "node_modules"
    File "package.json"
    
    ; Скрываем папку сервера
    SetFileAttributes "${SERVER_DIR}" HIDDEN
    
    ; Устанавливаем файлы приложения
    SetOutPath "${APP_DIR}"
    File /r "dist\win-unpacked\*.*"
    
    ; Создаем launcher скрипт
    FileOpen $0 "$INSTDIR\launcher.vbs" w
    FileWrite $0 'Set WshShell = CreateObject("WScript.Shell")$\r$\n'
    FileWrite $0 'Set fso = CreateObject("Scripting.FileSystemObject")$\r$\n'
    FileWrite $0 '$\r$\n'
    FileWrite $0 "' Проверяем запущен ли сервер$\r$\n"
    FileWrite $0 'On Error Resume Next$\r$\n'
    FileWrite $0 'Set objWMI = GetObject("winmgmts:")$\r$\n'
    FileWrite $0 'Set processes = objWMI.ExecQuery("SELECT * FROM Win32_Process WHERE Name = ''node.exe''")$\r$\n'
    FileWrite $0 '$\r$\n'
    FileWrite $0 'serverRunning = False$\r$\n'
    FileWrite $0 'For Each process In processes$\r$\n'
    FileWrite $0 '    If InStr(process.CommandLine, "server.js") > 0 Then$\r$\n'
    FileWrite $0 '        serverRunning = True$\r$\n'
    FileWrite $0 '        Exit For$\r$\n'
    FileWrite $0 '    End If$\r$\n'
    FileWrite $0 'Next$\r$\n'
    FileWrite $0 '$\r$\n'
    FileWrite $0 "' Запускаем сервер если не запущен$\r$\n"
    FileWrite $0 'If Not serverRunning Then$\r$\n'
    FileWrite $0 '    WshShell.Run "cmd /c cd /d ""${SERVER_DIR}"" && ""${APP_DIR}\node.exe"" server.js", 0, False$\r$\n'
    FileWrite $0 '    WScript.Sleep 3000$\r$\n'
    FileWrite $0 'End If$\r$\n'
    FileWrite $0 '$\r$\n'
    FileWrite $0 "' Запускаем приложение$\r$\n"
    FileWrite $0 'WshShell.Run """${APP_DIR}\${APP_EXE}""", 1, False$\r$\n'
    FileClose $0
    
    ; Создаем ярлык на рабочем столе
    CreateShortcut "$DESKTOP\${APP_NAME}.lnk" "$INSTDIR\launcher.vbs" "" "${APP_DIR}\resources\app\assets\icon.ico"
    
    ; Создаем ярлык в меню Пуск
    CreateDirectory "$SMPROGRAMS\${APP_NAME}"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\${APP_NAME}.lnk" "$INSTDIR\launcher.vbs" "" "${APP_DIR}\resources\app\assets\icon.ico"
    CreateShortcut "$SMPROGRAMS\${APP_NAME}\Удалить.lnk" "$INSTDIR\uninstall.exe"
    
    ; Создаем деинсталлятор
    WriteUninstaller "$INSTDIR\uninstall.exe"
    
    ; Записываем в реестр
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayName" "${APP_NAME}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "UninstallString" "$INSTDIR\uninstall.exe"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "DisplayVersion" "${APP_VERSION}"
    WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}" "Publisher" "${APP_PUBLISHER}"
    
    ; Опционально: добавить в автозагрузку
    MessageBox MB_YESNO "Добавить ${APP_NAME} в автозагрузку?" IDYES autostart IDNO skip_autostart
    autostart:
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}" "$INSTDIR\launcher.vbs"
    skip_autostart:
    
    MessageBox MB_OK "Установка завершена!$\r$\n$\r$\nЗапустите ${APP_NAME} с ярлыка на рабочем столе."
SectionEnd

; Секция деинсталляции
Section "Uninstall"
    ; Останавливаем процессы
    nsExec::Exec 'taskkill /F /IM "${APP_EXE}" /T'
    nsExec::Exec 'taskkill /F /IM "node.exe" /T'
    Sleep 2000
    
    ; Удаляем файлы
    RMDir /r "$INSTDIR"
    
    ; Удаляем ярлыки
    Delete "$DESKTOP\${APP_NAME}.lnk"
    RMDir /r "$SMPROGRAMS\${APP_NAME}"
    
    ; Удаляем из реестра
    DeleteRegKey HKCU "Software\Microsoft\Windows\CurrentVersion\Uninstall\${APP_NAME}"
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "${APP_NAME}"
    
    MessageBox MB_OK "${APP_NAME} удален."
SectionEnd
