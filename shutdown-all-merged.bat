@echo off
REM ======= Combined shutdown-all.bat (Batch + PowerShell) =======

REM ---- Batch commands ----
@echo off
title Shutting Down ALL Replicon Local Runner Processes

REM Set your runner project folder (change this path if you move your project)
set "RUNNERDIR=C:\replicon-industries\replicon-local-runner"

echo Scanning all processes for anything running from: %RUNNERDIR%
echo.

REM Loop through all running processes and kill if command line contains the runner path
for /f "skip=1 tokens=2,* delims=," %%a in ('wmic process get ProcessId,CommandLine /format:csv') do (
    echo %%b | find /I "%RUNNERDIR%" >nul
    if not errorlevel 1 (
        echo Killing process PID %%a running from %RUNNERDIR% ...
        taskkill /PID %%a /F >nul 2>&1
    )
)

echo.
echo All processes from %RUNNERDIR% terminated.
pause

REM ---- Call shutdown-all.ps1 for PowerShell-specific logic ----
powershell.exe -ExecutionPolicy Bypass -File "%~dp0shutdown-all.ps1"

echo All shutdown routines complete.
pause
