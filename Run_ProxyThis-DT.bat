@echo off
REM ProxYoda Desktop App Launcher
REM This batch file starts the ProxYoda Electron application with dev server

cd /d "%~dp0"

echo Starting ProxYoda Desktop App...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the dev server in a separate window
echo Starting development server...
start "ProxYoda Dev Server" cmd /k "node node_modules/vite/bin/vite.js"

REM Wait for dev server to start
timeout /t 5 /nobreak

REM Start the Electron app
echo Launching ProxYoda...
npx electron .

pause

