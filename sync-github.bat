@echo off
REM GitHub Portfolio Sync Script
REM Run this to update portfolio data from GitHub

echo.
echo ========================================
echo   GitHub Portfolio Sync
echo ========================================
echo.

REM Check if .env file exists and load it
if exist ".env" (
    echo Loading token from .env file...
    for /f "tokens=1,2 delims==" %%a in (.env) do (
        if "%%a"=="GITHUB_TOKEN" set GITHUB_TOKEN=%%b
    )
)

REM Check if token is set
if "%GITHUB_TOKEN%"=="" (
    echo ERROR: GITHUB_TOKEN not found!
    echo.
    echo Please either:
    echo   1. Create a .env file with GITHUB_TOKEN=your_token
    echo   2. Set environment variable: set GITHUB_TOKEN=your_token
    echo.
    echo Get your token at: https://github.com/settings/tokens
    echo.
    pause
    exit /b 1
)

echo Running sync script...
echo.
node scripts/github-sync.js

echo.
pause
