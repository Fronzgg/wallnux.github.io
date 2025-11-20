@echo off
echo ========================================
echo   WallNux Messenger - Portable Build
echo ========================================
echo.
echo Portable версия НЕ требует установки!
echo Просто запускаешь .exe и всё работает!
echo.

echo [1/2] Проверка зависимостей...
if not exist "node_modules\electron" (
    echo Установка Electron...
    call npm install electron electron-builder --save-dev
)

echo.
echo [2/2] Сборка portable версии...
echo Это быстрее чем установщик!
echo.

call npx electron-builder --win portable --x64

echo.
echo ========================================
echo   Сборка завершена!
echo ========================================
echo.
echo Файл: dist\WallNux Messenger-1.0.0-portable.exe
echo.
echo Этот .exe можно запускать БЕЗ установки!
echo Просто скопируй на любой компьютер и запусти!
echo.
dir dist\*portable*.exe /b 2>nul
echo.
pause
