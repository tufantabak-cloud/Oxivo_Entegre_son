@echo off
chcp 65001 >nul
color 0A
title Entegre Yonetim Sistemi - Local Mode

echo.
echo ================================================
echo   Entegre Yonetim Sistemi
echo   Mod: Local (Sadece bu bilgisayar)
echo ================================================
echo.
echo Sunucu baslatiliyor...
echo.
echo Erisim Adresi:
echo   http://localhost:3000
echo.
echo Not: Uygulamayi kapatmak icin CTRL+C basin
echo.
echo ------------------------------------------------
echo.

call npm run dev

echo.
echo ------------------------------------------------
echo Uygulama kapatildi
echo.
pause
