; Кастомный NSIS скрипт для WallNux Messenger
; Этот файл включается в основной установщик electron-builder

!macro customInstall
    ; Создаем launcher скрипт в папке установки
    FileOpen $0 "$INSTDIR\start-server.vbs" w
    FileWrite $0 'Set WshShell = CreateObject("WScript.Shell")$\r$\n'
    FileWrite $0 'Set fso = CreateObject("Scripting.FileSystemObject")$\r$\n'
    FileWrite $0 '$\r$\n'
    FileWrite $0 "appPath = fso.GetParentFolderName(WScript.ScriptFullName)$\r$\n"
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
    FileWrite $0 '    WshShell.Run "cmd /c cd /d """ & appPath & "\resources\app"" && """ & appPath & "\WallNux Messenger.exe"" server.js", 0, False$\r$\n'
    FileWrite $0 '    WScript.Sleep 3000$\r$\n'
    FileWrite $0 'End If$\r$\n'
    FileWrite $0 '$\r$\n'
    FileWrite $0 "' Запускаем приложение$\r$\n"
    FileWrite $0 'WshShell.Run """" & appPath & "\WallNux Messenger.exe""", 1, False$\r$\n'
    FileClose $0
    
    ; Обновляем ярлыки чтобы они запускали через VBS
    Delete "$DESKTOP\WallNux Messenger.lnk"
    Delete "$SMPROGRAMS\WallNux Messenger\WallNux Messenger.lnk"
    
    CreateShortcut "$DESKTOP\WallNux Messenger.lnk" "$INSTDIR\start-server.vbs" "" "$INSTDIR\WallNux Messenger.exe" 0
    CreateShortcut "$SMPROGRAMS\WallNux Messenger\WallNux Messenger.lnk" "$INSTDIR\start-server.vbs" "" "$INSTDIR\WallNux Messenger.exe" 0
    
    ; Спрашиваем про автозагрузку
    MessageBox MB_YESNO "Добавить WallNux Messenger в автозагрузку?" IDYES autostart IDNO skip_autostart
    autostart:
        WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "WallNux Messenger" "$INSTDIR\start-server.vbs"
    skip_autostart:
!macroend

!macro customUnInstall
    ; Останавливаем процессы
    nsExec::Exec 'taskkill /F /IM "WallNux Messenger.exe" /T'
    nsExec::Exec 'taskkill /F /IM "node.exe" /T'
    Sleep 2000
    
    ; Удаляем из автозагрузки
    DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "WallNux Messenger"
    
    ; Удаляем launcher
    Delete "$INSTDIR\start-server.vbs"
!macroend
