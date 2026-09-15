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
if not exist ".env" (
    echo Discord bot tokeni .env dosyasina kaydedilecek.
    echo Bu dosya GitHub'a gonderilmez.
    echo.
    set "DISCORD_TOKEN="
    set /p "DISCORD_TOKEN=Discord bot tokenini girin: "

    if not defined DISCORD_TOKEN (
        echo.
        echo [HATA] Token girilmedi. Kurulum tamamlanamadi.
        pause
        exit /b 1
    )

    >".env" echo DISCORD_TOKEN=%DISCORD_TOKEN%
    echo.
    echo Token .env dosyasina kaydedildi.
) else (
    echo .env dosyasi zaten mevcut, token yeniden sorulmadi.
)

echo.
echo Kurulum tamamlandi.
echo Botu baslatmak icin baslat.bat dosyasini calistirin.
pause
exit /b 0