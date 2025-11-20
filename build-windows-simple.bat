@echo off
echo ========================================
echo   WallNux Messenger - Simple Build
echo   (без пересборки нативных модулей)
echo ========================================
echo.

echo [1/3] Очистка старой сборки...
rmdir /s /q dist 2>nul

echo.
echo [2/3] Установка зависимостей...
call npm install
if errorlevel 1 (
    echo ОШИБКА: Не удалось установить зависимости
    pause
    exit /b 1
)

echo.
echo [3/3] Сборка приложения (только x64)...
call npx electron-builder --win --x64 --dir
if errorlevel 1 (
    echo ОШИБКА: Не удалось собрать приложение
    pause
    exit /b 1
)

echo.
echo Готово!
echo.
echo Приложение находится в: dist\win-unpacked\
echo Запусти: dist\win-unpacked\WallNux Messenger.exe
echo.
pause
