@echo off
echo Preparing Deployment...

REM Copy Public Folder
echo Copying public folder...
robocopy public .next\standalone\public /E /IS /IT

REM Copy Static Assets
echo Copying .next/static folder...
robocopy .next\static .next\standalone\.next\static /E /IS /IT

echo.
echo Deployment Preparation Complete!
echo.
echo To run the server:
echo 1. Navigate to: .next\standalone
echo 2. Run: node server.js
echo.
pause
