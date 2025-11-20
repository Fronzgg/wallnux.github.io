@echo off
if not DEFINED IS_MINIMIZED set IS_MINIMIZED=1 && start "" /min "%~dpnx0" %* && exit

:: Папки
set "APP_DIR=%APPDATA%\WallNux"
set "SERVER_DIR=%APP_DIR%\server"
set "EXE_DIR=%APP_DIR%\app"

:: Переходим в папку сервера
cd /d "%SERVER_DIR%"

:: Проверяем запущен ли сервер
netstat -ano | findstr ":3000" >nul 2>nul
if %errorlevel% neq 0 (
    :: Запускаем сервер
    start /B node server.js
)

:: Ждем
timeout /t 3 >nul

:: Запускаем приложение
if exist "%EXE_DIR%\wallnux.exe" (
    start "" "%EXE_DIR%\wallnux.exe"
)

:: НЕ ЗАКРЫВАЕМСЯ - ждем бесконечно
:loop
timeout /t 3600 >nul
goto loop
