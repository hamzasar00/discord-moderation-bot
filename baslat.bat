@echo off
setlocal
title Darth.vfx - Bot

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi.
    echo Once Node.js'i https://nodejs.org adresinden kurun.
    pause
    exit /b 1
)

if not exist "node_modules\" (
    echo [HATA] Gerekli paketler kurulu degil.
    echo Once kurulum.bat dosyasini calistirin.
    pause
    exit /b 1
)

if not defined DISCORD_TOKEN if not exist ".env" (
    echo [HATA] .env dosyasi bulunamadi.
    echo Once kurulum.bat dosyasini calistirip Discord tokenini kaydedin.
    pause
    exit /b 1
)

echo Darth.vfx baslatiliyor...
echo Durdurmak icin bu pencereyi kapatabilir veya CTRL+C kullanabilirsiniz.
echo.
call npm start

if errorlevel 1 (
    echo.
    echo [HATA] Bot beklenmedik sekilde durdu.
    pause
    exit /b 1
)

pause
exit /b 0