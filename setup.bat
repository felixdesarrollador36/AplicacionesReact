@echo off
REM Script de configuración rápida para Document Viewer App (Windows)

echo 🚀 Iniciando configuracion de Document Viewer App...
echo.

REM Verificar si Node.js está instalado
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js no está instalado. Por favor, instálalo desde https://nodejs.org
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
for /f "tokens=*" %%i in ('npm --version') do set NPM_VERSION=%%i

echo ✅ Node.js detectado: %NODE_VERSION%
echo ✅ npm detectado: %NPM_VERSION%
echo.

echo 📦 Instalando Expo CLI globalmente...
call npm install -g expo-cli

echo.
echo 📦 Instalando dependencias del proyecto...
call npm install

echo.
echo ✅ ¡Configuracion completada!
echo.
echo 🎯 Próximos pasos:
echo 1. Ejecuta: npm start
echo 2. Presiona 'a' para Android, 'i' para iOS, o 'w' para web
echo.
echo Para mas información, lee QUICK_START.md
pause
