Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

' Получаем путь к папке со скриптом
scriptPath = fso.GetParentFolderName(WScript.ScriptFullName)

' Запускаем сервер в фоне (без окна)
WshShell.Run "cmd /c cd /d """ & scriptPath & """ && node server.js", 0, False

' Ждем 3 секунды
WScript.Sleep 3000

' Запускаем Electron приложение
WshShell.Run """" & scriptPath & "\WallNux Messenger.exe""", 1, False

' Показываем уведомление
WshShell.Popup "WallNux Messenger запущен!", 2, "WallNux Messenger", 64
