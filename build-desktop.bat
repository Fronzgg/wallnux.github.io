@echo off
echo ========================================
echo   WallNux Messenger - Desktop Build
echo   ПОЛНАЯ ЧИСТАЯ СБОРКА
echo ========================================
echo.

echo [1/8] Остановка всех процессов...
taskkill /F /IM electron.exe 2>nul
taskkill /F /IM node.exe 2>nul
taskkill /F /IM "WallNux Messenger.exe" 2>nul
echo Готово!
timeout /t 2 >nul

echo.
echo [2/8] Удаление старой сборки...
if exist "dist" (
    echo Удаление папки dist...
    rmdir /s /q dist
    echo Готово!
) else (
    echo Папка dist не найдена, пропускаем
)

echo.
echo [3/8] Очистка кэша electron-builder...
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    echo Очистка кэша...
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
    echo Готово!
)

echo.
echo [4/8] Проверка зависимостей...
if not exist "node_modules\electron" (
    echo Установка Electron...
    call npm install electron electron-builder --save-dev
) else (
    echo Electron уже установлен
)

echo.
echo [5/8] Проверка файлов...
if not exist "electron-main.js" (
    echo ОШИБКА: electron-main.js не найден!
    pause
    exit /b 1
)

if not exist "server.js" (
    echo ОШИБКА: server.js не найден!
    pause
    exit /b 1
)
echo Все файлы на месте!

echo.
echo [6/8] Очистка временных файлов...
del /Q *.log 2>nul
del /Q npm-debug.log* 2>nul
echo Готово!

echo.
echo [7/8] Тестовый запуск (опционально)...
echo Хотите протестировать перед сборкой? (Y/N)
set /p test="Ваш выбор: "
if /i "%test%"=="Y" (
    echo Запуск тестового окна...
    echo Закройте окно если всё работает правильно
    timeout /t 2 >nul
    start /B node server.js
    timeout /t 3 >nul
    start /wait cmd /c "npx electron ."
    taskkill /F /IM node.exe 2>nul
)

echo.
echo [8/8] Сборка приложения...
echo ========================================
echo   НАЧИНАЕТСЯ СБОРКА
echo   Это может занять 5-10 минут...
echo ========================================
echo.

call npm run build:win

echo.
if exist "dist\*.exe" (
    echo ========================================
    echo   СБОРКА ЗАВЕРШЕНА УСПЕШНО!
    echo ========================================
    echo.
    echo Файлы в папке: dist\
    echo.
    dir dist\*.exe /b
    echo.
    echo Размер файлов:
    dir dist\*.exe
    echo.
    
    echo.
    echo [ПОСТ-ОБРАБОТКА] Копирование launcher файлов...
    call post-build.bat
    
    echo.
    echo ========================================
    echo   Готово к распространению!
    echo ========================================
    echo.
    echo Для запуска используй:
    echo dist\win-unpacked\start-wallnux-silent.vbs
    echo.
) else (
    echo ========================================
    echo   ОШИБКА СБОРКИ!
    echo ========================================
    echo.
    echo Проверьте логи выше для деталей
    echo.
)

echo.
pause
