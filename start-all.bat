@echo off
title Starting Replicon AI Runner

REM Start backend with unique title
start "Replicon Backend" cmd /k "cd /d %~dp0 && title RepliconBackend && node interface-server.js"

REM Start UI (edit this if you don't need a UI server)
start "Replicon UI" cmd /k "cd /d %~dp0 && title RepliconUI && npm run start-ui"
