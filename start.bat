@echo off
title ElderCare - Starting System with MySQL
echo ====================================================
echo  Starting ElderCare System (MySQL + Server + Client)
echo ====================================================

:: 1. Check if MySQL port 3306 is listening, start XAMPP MySQL if needed
netstat -ano | findstr :3306 >nul
if %errorlevel% neq 0 (
    echo [MySQL] Port 3306 is not active.
    if exist "C:\xampp\mysql\bin\mysqld.exe" (
        echo [MySQL] Auto-starting XAMPP MySQL in background...
        start "" /B "C:\xampp\mysql\bin\mysqld.exe" --defaults-file="C:\xampp\mysql\bin\my.ini" --standalone
        timeout /t 3 /nobreak >nul
    ) else (
        echo [MySQL] Notice: C:\xampp\mysql\bin\mysqld.exe not found. Please ensure MySQL is running.
    )
) else (
    echo [MySQL] MySQL service is already active on port 3306.
)

:: 2. Launch backend server and frontend client
echo [ElderCare] Launching backend server and web app...
cd /D "%~dp0"
npm run dev
