@echo off
cd /d "%~dp0"
echo Installing the scheduler (one time)...
call npm install
echo.
call npm run check
pause
