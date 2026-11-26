@echo off
title LockExam CBT Server & Database
cd /d "%~dp0"
echo =========================================================
echo      MEMULAI SERVER & DATABASE LOCKEXAM CBT
echo =========================================================
echo.
echo [1/2] Menyiapkan server lokal di port 3000...
echo [2/2] Membuka browser ke http://localhost:3000 ...
start http://localhost:3000
echo.
echo =========================================================
echo  SERVER AKTIF: http://localhost:3000
echo  Jangan tutup jendela ini selama menggunakan aplikasi.
echo  Tekan Ctrl+C untuk mematikan server.
echo =========================================================
echo.
powershell -ExecutionPolicy Bypass -File "%~dp0server.ps1" -Port 3000
pause
