@echo off
title HMAS Project Setup v2.0
color 0A

echo.
echo ============================================
echo      HMAS Project Setup v2.0
echo ============================================
echo.

cd /d "%~dp0"

echo Creating Folder Structure...
echo.

REM ===========================
REM FOLDERS
REM ===========================

mkdir config 2>nul
mkdir config\services_policies 2>nul
mkdir config\servers 2>nul

mkdir middleware 2>nul
mkdir services 2>nul
mkdir runtime 2>nul
mkdir logs 2>nul
mkdir utils 2>nul

REM ===========================
REM SERVICE POLICIES
REM ===========================

type nul > config\services_policies\send.json
type nul > config\services_policies\parser.json
type nul > config\services_policies\image.json
type nul > config\services_policies\pdf.json
type nul > config\services_policies\voice.json
type nul > config\services_policies\location.json
type nul > config\services_policies\webhook.json
type nul > config\services_policies\scheduler.json
type nul > config\services_policies\aiReply.json

REM ===========================
REM SERVER CONFIG
REM ===========================

type nul > config\servers\A001.json
type nul > config\servers\SC_HZ.json

REM ===========================
REM MIDDLEWARE
REM ===========================

type nul > middleware\apiKey.js
type nul > middleware\validation.js
type nul > middleware\rateLimiter.js
type nul > middleware\quota.js
type nul > middleware\maintenance.js

REM ===========================
REM SERVICES
REM ===========================

type nul > services\send.js
type nul > services\parser.js
type nul > services\image.js
type nul > services\pdf.js
type nul > services\voice.js
type nul > services\location.js
type nul > services\webhook.js
type nul > services\scheduler.js
type nul > services\aiReply.js

REM ===========================
REM RUNTIME
REM ===========================

echo {}> runtime\usage.json

REM ===========================
REM UTILS
REM ===========================

type nul > utils\response.js
type nul > utils\logger.js
type nul > utils\requestId.js

echo.
echo ============================================
echo        HMAS Setup Completed Successfully
echo ============================================
echo.
echo Project Structure Ready.
echo Happy Coding!
echo.

pause