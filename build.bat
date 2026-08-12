@echo off
echo =========================================
echo   Building Minecraft Addon Wiki Engine
echo =========================================

echo 1. Checking dependencies...
call bun install --frozen-lockfile
if %ERRORLEVEL% NEQ 0 (
    echo Lockfile verification failed, running standard install...
    call bun install
)

echo 2. Running TypeScript linter...
call bun run lint
if %ERRORLEVEL% NEQ 0 (
    echo Typecheck failed!
    exit /b %ERRORLEVEL%
)

echo 3. Building Vite client and Express server...
call bun run build
if %ERRORLEVEL% NEQ 0 (
    echo Build failed!
    exit /b %ERRORLEVEL%
)

echo =========================================
echo   Build completed successfully!
echo =========================================
