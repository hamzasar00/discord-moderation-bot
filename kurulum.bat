@echo off
setlocal
title Darth.vfx - Kurulum

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
    echo [HATA] Node.js bulunamadi.
    echo Node.js'i https://nodejs.org adresinden kurup bu dosyayi tekrar calistirin.
    pause
    exit /b 1
)

echo Node.js surumu:
node --version
echo.
echo Gerekli paketler kuruluyor...
call npm install

if errorlevel 1 (
    echo.
    echo [HATA] Paket kurulumu basarisiz oldu.
    pause
    exit /b 1
)

echo.
echo Kurulum tamamlandi.
echo Botu baslatmak icin baslat.bat dosyasini calistirin.
pause
exit /b 0