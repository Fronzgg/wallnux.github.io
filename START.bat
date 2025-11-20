@echo off
:: WallNux Messenger - Простой запуск
title WallNux Messenger

:: Скрытая папка на рабочем столе
set "WALLNUX=%USERPROFILE%\Desktop\.wallnux"

:: ============================================
:: ПЕРВЫЙ ЗАПУСК - УСТАНОВКА
:: ============================================
if not exist "%WALLNUX%" (
    cls
    echo.
    echo ========================================
    echo   WallNux Messenger
    echo   Первый запуск - Установка
    echo ========================================
    echo.
    
    :: Создаем скрытую папку
    mkdir "%WALLNUX%"
    
    :: Копируем файлы
    echo Копирование файлов...
    xcopy /E /I /Y /Q "%~dp0" "%WALLNUX%" >nul
    
    :: Скрываем папку
    attrib +h "%WALLNUX%"
    
    :: Запрещаем изменение (только чтение)
    echo Настройка прав доступа...
    icacls "%WALLNUX%" /inheritance:r >nul
    icacls "%WALLNUX%" /grant:r %USERNAME%:^(OI^)^(CI^)RX >nul
    
    echo.
    echo Установка завершена!
    echo.
    timeout /t 2 >nul
)

:: ============================================
:: ЗАПУСК
:: ============================================
cd /d "%WALLNUX%"

:: Проверяем Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ОШИБКА: Node.js не установлен!
    echo Установите: https://nodejs.org/
    pause
    exit /b 1
)

:: Проверяем запущен ли сервер
netstat -ano | findstr ":3000" >nul 2>nul
if %errorlevel% neq 0 (
    :: Запускаем сервер
    start /B node server.js
    timeout /t 3 >nul
)

:: Запускаем приложение
if exist "dist\win-unpacked\WallNux Messenger.exe" (
    start "" "dist\win-unpacked\WallNux Messenger.exe"
) else (
    start http://localhost:3000/login.html
)

exit
