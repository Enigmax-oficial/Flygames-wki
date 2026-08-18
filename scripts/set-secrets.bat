@echo off
setlocal enabledelayedexpansion

if "%JWT_SECRET%"=="" (
    echo Error: JWT_SECRET environment variable is not set or empty. >&2
    exit /b 1
)

if "%RESEND_API_KEY%"=="" (
    echo Error: RESEND_API_KEY environment variable is not set or empty. >&2
    exit /b 1
)

if "%RESEND_FROM_EMAIL%"=="" (
    echo Error: RESEND_FROM_EMAIL environment variable is not set or empty. >&2
    exit /b 1
)

echo Setting Cloudflare Worker secrets non-interactively...

echo !JWT_SECRET!| npx wrangler secret put JWT_SECRET
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo !RESEND_API_KEY!| npx wrangler secret put RESEND_API_KEY
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo !RESEND_FROM_EMAIL!| npx wrangler secret put RESEND_FROM_EMAIL
if %ERRORLEVEL% NEQ 0 exit /b %ERRORLEVEL%

echo Cloudflare Worker secrets successfully updated.
