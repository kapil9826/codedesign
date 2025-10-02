@echo off
echo 🚀 Starting Ticket Management Portal Build Process...
echo.

REM Get build mode from command line arguments
set BUILD_MODE=%1
if "%BUILD_MODE%"=="" set BUILD_MODE=production

echo 📦 Building for %BUILD_MODE% mode...

REM Clean previous build
echo 🧹 Cleaning previous build...
if exist dist rmdir /s /q dist
if exist dist-staging rmdir /s /q dist-staging
if exist dist-dev rmdir /s /q dist-dev

REM Install dependencies
echo 📥 Installing dependencies...
call npm install
if errorlevel 1 (
    echo ❌ Failed to install dependencies
    exit /b 1
)

REM Build the application
echo 🔨 Building application...
if "%BUILD_MODE%"=="production" (
    call npm run build
) else if "%BUILD_MODE%"=="staging" (
    call npm run build:staging
) else if "%BUILD_MODE%"=="development" (
    call npm run build:dev
) else (
    echo ❌ Invalid build mode: %BUILD_MODE%
    echo Available modes: production, staging, development
    exit /b 1
)

if errorlevel 1 (
    echo ❌ Build failed
    exit /b 1
)

REM Create build info
echo 📊 Creating build info...
echo { > build-info.json
echo   "buildTime": "%date% %time%", >> build-info.json
echo   "mode": "%BUILD_MODE%", >> build-info.json
echo   "version": "1.0.0", >> build-info.json
echo   "nodeVersion": "%node_version%" >> build-info.json
echo } >> build-info.json

echo.
echo ✅ Build completed successfully!
echo 📁 Output directory: dist
echo 📊 Build mode: %BUILD_MODE%
echo ⏰ Build time: %date% %time%
echo.
echo 🎉 Build process completed!
echo.
echo 📋 Next steps:
echo 1. Test the build: npm run preview
echo 2. Deploy to your server
echo 3. Configure your web server to serve the static files

