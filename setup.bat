@echo off
echo ===========================================
echo   NEXUS Prediction Market - Setup Script
echo ===========================================
echo.

:: 1. Check Node.js
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js not found! Please install it from https://nodejs.org/
    pause
    exit /b
)
echo [SUCCESS] Node.js detected.

:: 2. Check and Install pnpm
where pnpm >nul 2>nul
if %errorlevel% neq 0 (
    echo [INFO] Installing pnpm...
    call npm install -g pnpm
) else (
    echo [SUCCESS] pnpm detected.
)

:: 3. Install dependencies
echo [INFO] Installing project dependencies (this may take a while)...
call pnpm install

:: 4. Setup .env
if not exist .env (
    echo [INFO] Creating default .env file...
    copy .env.example .env
)

echo.
echo ===========================================
echo   Setup Complete! You can now start the app.
echo ===========================================
echo.
echo [HINT] Run: pnpm dev
echo.
pause
