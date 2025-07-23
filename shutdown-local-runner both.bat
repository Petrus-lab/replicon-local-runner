@echo off
title 🛑 Shutting Down Replicon Local AI Runner

echo [1/4] Closing runner tabs by window title...

:: Kill AI Backend tab
taskkill /F /FI "WINDOWTITLE eq AI Backend - node interface-server.js" >nul 2>&1

:: Kill Interface UI tab
taskkill /F /FI "WINDOWTITLE eq Interface UI - lite-server" >nul 2>&1

echo [2/4] Ensuring ports are freed...

:: Force close anything on port 3001 (AI backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

:: Force close anything on port 5500 (Interface UI)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5500" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

echo [3/4] ✅ All AI runner systems shut down.

echo [4/4] ✅ Main platform (port 3000) not affected.
pause
