#!/bin/bash

# Script de configuración rápida para Document Viewer App

echo "🚀 Iniciando configuración de Document Viewer App..."
echo ""

# Verificar si Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js no está instalado. Por favor, instálalo desde https://nodejs.org"
    exit 1
fi

echo "✅ Node.js detectado: $(node --version)"
echo "✅ npm detectado: $(npm --version)"
echo ""

# Instalar dependencias globales
echo "📦 Instalando Expo CLI globalmente..."
npm install -g expo-cli

echo ""
echo "📦 Instalando dependencias del proyecto..."
npm install

echo ""
echo "✅ ¡Configuración completada!"
echo ""
echo "🎯 Próximos pasos:"
echo "1. Ejecuta: npm start"
echo "2. Presiona 'a' para Android, 'i' para iOS, o 'w' para web"
echo ""
echo "Para más información, lee QUICK_START.md"
