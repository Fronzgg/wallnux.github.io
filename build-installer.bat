@echo off
echo ========================================
echo   WallNux Messenger - Installer Build
echo ========================================
echo.

echo [1/6] Остановка процессов...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
timeout /t 2 >nul

echo.
echo [2/6] Очистка...
if exist "dist" (
    rmdir /s /q dist
)

echo.
echo [3/6] Проверка файлов...
if not exist "electron-main-simple.js" (
    echo ОШИБКА: electron-main-simple.js не найден!
    pause
    exit /b 1
)

if not exist "installer-script.nsh" (
    echo ОШИБКА: installer-script.nsh не найден!
    pause
    exit /b 1
)

echo.
echo [4/6] Проверка зависимостей...
if not exist "node_modules\electron-builder" (
    echo Установка electron-builder...
    call npm install electron-builder --save-dev
)

echo.
echo [5/6] Сборка установщика...
echo ========================================
echo   Это займет 5-10 минут...
echo ========================================
echo.

call npx electron-builder --win nsis --x64

echo.
echo [6/6] Проверка результата...
if exist "dist\WallNux Messenger-Setup-*.exe" (
    echo.
    echo ========================================
    echo   УСТАНОВЩИК СОЗДАН УСПЕШНО!
    echo ========================================
    echo.
    echo Файл установщика:
    dir "dist\WallNux Messenger-Setup-*.exe" /b
    echo.
    echo Размер:
    dir "dist\WallNux Messenger-Setup-*.exe"
    echo.
    echo ========================================
    echo   Готово к распространению!
    echo ========================================
    echo.
    echo Установщик автоматически:
    echo - Установит приложение в AppData
    echo - Создаст ярлыки на рабочем столе
    echo - Запустит сервер перед приложением
    echo - Предложит добавить в автозагрузку
    echo.
) else (
    echo.
    echo ========================================
    echo   ОШИБКА СБОРКИ!
    echo ========================================
    echo.
    echo Проверьте логи выше
    echo.
)

pause
