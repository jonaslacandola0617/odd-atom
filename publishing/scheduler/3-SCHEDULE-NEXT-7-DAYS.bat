@echo off
cd /d "%~dp0"
call npm run schedule -- --days 7
pause
