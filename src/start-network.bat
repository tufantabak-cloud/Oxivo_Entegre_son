@echo off
chcp 65001 >nul
color 0B
title Entegre Yonetim Sistemi - Network Mode

echo.
echo ================================================
echo   Entegre Yonetim Sistemi
echo   Mod: Network (Tum cihazlardan erisim)
echo ================================================
echo.
echo Sunucu baslatiliyor...
echo.
echo Erisim Adresleri:
echo   Bu bilgisayar: http://localhost:3000
echo   Diger cihazlar: Asagida gosterilen IP adresini kullanin
echo.
echo Not: WiFi'de ayni agda olmalisiniz
echo.
echo ------------------------------------------------
echo.

call npm run dev:host

echo.
echo ------------------------------------------------
echo Uygulama kapatildi
echo.
pause
