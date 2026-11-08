@echo off
title Launching Smart Mess Management System...
echo ========================================================
echo     Starting Smart Mess Management System Desktop App
echo ========================================================

:: Check for Google Chrome
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="https://smartmess-system.vercel.app"
    exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="https://smartmess-system.vercel.app"
    exit /b
)
if exist "%LocalAppData%\Google\Chrome\Application\chrome.exe" (
    start "" "%LocalAppData%\Google\Chrome\Application\chrome.exe" --app="https://smartmess-system.vercel.app"
    exit /b
)

:: Check for Microsoft Edge (installed on every Windows 10/11)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="https://smartmess-system.vercel.app"
    exit /b
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="https://smartmess-system.vercel.app"
    exit /b
)

:: Fallback default browser
start "" "https://smartmess-system.vercel.app"
exit /b
