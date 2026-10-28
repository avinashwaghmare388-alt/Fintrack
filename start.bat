@echo off
title FinTrack
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is not installed. Get the LTS version from https://nodejs.org , install it, then run this again.
  pause
  exit /b 1
)
node scripts\dev.mjs
pause
