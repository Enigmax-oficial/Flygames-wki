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

echo 4. Checking Cloudflare Worker secrets...
if defined JWT_SECRET if defined RESEND_API_KEY if defined RESEND_FROM_EMAIL (
    echo Secrets detected in environment variables. Updating Cloudflare secrets...
    call scripts\set-secrets.bat
    if %ERRORLEVEL% NEQ 0 (
        echo Failed to configure Cloudflare secrets!
        exit /b %ERRORLEVEL%
    )
) else (
    echo Worker secrets not all present in environment; skipping automated secret update.
)

echo =========================================
echo   Build completed successfully!
echo =========================================
