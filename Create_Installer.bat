@echo off
echo ============================================
echo   ProxYoda Local Installer Builder
echo ============================================
echo.

:: Set the output directory
set OUTPUT_DIR=C:\Users\aquez\OneDrive\AI\Augment\ProxyThis\LocalBuilds

:: Create output directory if it doesn't exist
if not exist "%OUTPUT_DIR%" (
    echo Creating output directory: %OUTPUT_DIR%
    mkdir "%OUTPUT_DIR%"
)

:: Navigate to project directory
cd /d "%~dp0"

echo.
echo Step 1: Building Vite app...
echo ----------------------------------------
call npm run build
if %ERRORLEVEL% neq 0 (
    echo ERROR: Vite build failed!
    pause
    exit /b 1
)

echo.
echo Step 2: Building Electron installer...
echo ----------------------------------------
echo Output will be saved to: %OUTPUT_DIR%
echo.

:: Run electron-builder with custom output directory
call npx electron-builder --win --config.directories.output="%OUTPUT_DIR%"
if %ERRORLEVEL% neq 0 (
    echo ERROR: Electron builder failed!
    pause
    exit /b 1
)

echo.
echo ============================================
echo   Build Complete!
echo ============================================
echo.
echo Installers saved to: %OUTPUT_DIR%
echo.

:: List the created files
dir "%OUTPUT_DIR%\*.exe" /b 2>nul

echo.
pause

