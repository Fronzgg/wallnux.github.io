@echo off
echo ========================================
echo   WallNux Messenger - NW.js Build
echo ========================================
echo.

echo [1/3] Установка зависимостей...
call npm install
if errorlevel 1 (
    echo ОШИБКА: Не удалось установить зависимости
    pause
    exit /b 1
)

echo.
echo [2/3] Сборка приложения через NW.js...
echo Это может занять 5-10 минут...
echo.
call npx nwbuild --mode=build --version=latest --flavor=normal --platform=win64 --srcDir=. --outDir=build .
if errorlevel 1 (
    echo ОШИБКА: Не удалось собрать приложение
    pause
    exit /b 1
)

echo.
echo [3/3] Готово!
echo.
echo Приложение находится в: build\
echo.
dir /b build\ 2>nul
echo.
pause
