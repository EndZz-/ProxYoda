@echo off
REM ProxYoda - Video Proxy Manager
REM Double-click this file to launch the application

setlocal
cd /d "%~dp0"

cls
echo.
echo ========================================
echo   ProxYoda - Video Proxy Manager
echo ========================================
echo.
echo Starting the application...
echo Please wait while the dev server starts...
echo.

REM Start the dev server in a new window
start "ProxYoda Dev Server" "C:\Program Files\nodejs\node.exe" node_modules\vite\bin\vite.js

REM Wait for the server to start
timeout /t 10 /nobreak

REM Open the browser
echo Opening browser...
start http://localhost:5173

echo.
echo ========================================
echo Application is running!
echo Open your browser to: http://localhost:5173
echo ========================================
echo.
timeout /t 3 /nobreak
endlocal

