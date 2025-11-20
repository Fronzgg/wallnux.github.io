@echo off
echo ========================================
echo   Создание установщика
echo ========================================
echo.

echo [1/3] Копирование uninstaller.bat в проект...
copy /Y uninstaller.bat "%APPDATA%\WallNux\uninstaller.bat" 2>nul

echo.
echo [2/3] Создание самораспаковывающегося архива...
echo.
echo Используем 7-Zip для создания SFX архива...
echo.

if not exist "C:\Program Files\7-Zip\7z.exe" (
    echo ОШИБКА: 7-Zip не найден!
    echo.
    echo Установи 7-Zip: https://www.7-zip.org/
    echo Или используй simple-installer.bat напрямую
    echo.
    pause
    exit /b 1
)

:: Создаем список файлов для архива
echo simple-installer.bat > files.txt
echo server.js >> files.txt
echo database.js >> files.txt
echo discord_clone.db >> files.txt
echo package.json >> files.txt
echo node_modules >> files.txt
echo *.html >> files.txt
echo *.css >> files.txt
echo script.js >> files.txt
echo auth.js >> files.txt
echo modern-features.js >> files.txt
echo badges.js >> files.txt
echo notifications.js >> files.txt
echo admin-features.js >> files.txt
echo ban-system.js >> files.txt
echo telegram-search.js >> files.txt
echo p2p-adapter.js >> files.txt
echo p2p-manager.js >> files.txt
echo assets >> files.txt

:: Создаем архив
"C:\Program Files\7-Zip\7z.exe" a -t7z installer-temp.7z @files.txt -mx9

:: Создаем SFX
copy /b "C:\Program Files\7-Zip\7zSD.sfx" + sfx-config.txt + installer-temp.7z "WallNux-Messenger-Installer.exe"

:: Очистка
del files.txt
del installer-temp.7z

echo.
echo [3/3] Готово!
echo.
echo ========================================
echo   Установщик создан!
echo ========================================
echo.
echo Файл: WallNux-Messenger-Installer.exe
echo.
dir "WallNux-Messenger-Installer.exe"
echo.
pause
