@echo off
title Shutting Down Replicon Local AI Runner

echo [1/3] Identifying runner processes on ports 3001 and 5500...

:: Initialize variables
set "PID_3001="
set "PID_5500="

:: Find PID for port 3001 (AI backend)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":3001" ^| find "LISTENING"') do set "PID_3001=%%a"

:: Find PID for port 5500 (Interface UI)
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5500" ^| find "LISTENING"') do set "PID_5500=%%a"

echo [2/3] Terminating runner processes...

:: Kill PID on port 3001 if found
if defined PID_3001 (
    echo Killing PID %PID_3001% on port 3001...
    taskkill /F /T /PID %PID_3001% >nul 2>&1
    if errorlevel 1 (
        echo Failed to kill PID %PID_3001%. Check if it exists or requires admin privileges.
    ) else (
        echo PID %PID_3001% terminated successfully.
    )
) else (
    echo No process found on port 3001.
)

:: Kill PID on port 5500 if found
if defined PID_5500 (
    echo Killing PID %PID_5500% on port 5500...
    taskkill /F /T /PID %PID_5500% >nul 2>&1
    if errorlevel 1 (
        echo Failed to kill PID %PID_5500%. Check if it exists or requires admin privileges.
    ) else (
        echo PID %PID_5500% terminated successfully.
    )
) else (
    echo No process found on port 5500.
)

echo [3/3] Verifying shutdown...

:: Check if ports are free
netstat -aon | find ":3001" | find "LISTENING" >nul
if errorlevel 1 (
    echo Port 3001 is free.
) else (
    echo Warning: Port 3001 is still in use.
)

netstat -aon | find ":5500" | find "LISTENING" >nul
if errorlevel 1 (
    echo Port 5500 is free.
) else (
    echo Warning: Port 5500 is still in use.
)

echo Shutdown complete. Press any key to close...
pause
exit