@echo off
echo ========================================
echo   Очистка и сборка
echo ========================================
echo.

echo [1/4] Остановка всех процессов...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM "WallNux Messenger.exe" 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo [2/4] Очистка папки dist...
if exist dist (
    rmdir /s /q dist
)
timeout /t 1 >nul

echo.
echo [3/4] Очистка кэша electron-builder...
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
)

echo.
echo [4/4] Сборка portable версии...
call npx electron-builder --win portable --x64

echo.
echo ========================================
if exist "dist\*.exe" (
    echo   Успешно собрано!
    echo ========================================
    echo.
    dir dist\*.exe /b
) else (
    echo   Ошибка сборки
    echo ========================================
)
echo.
pause
