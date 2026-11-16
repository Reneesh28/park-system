@echo off
echo Starting PARKWISE Frontend Server...
cd /d "%~dp0"
start "" http://localhost:3000
node server.js
pause
