#!/bin/bash

# Script para hacer push inicial a GitHub
# Ejecutar después de crear el repositorio en GitHub

echo "🚀 Configurando remote origin..."
git remote add origin https://github.com/Rodolfoborja/meet-analyzer.git

echo "📤 Haciendo push inicial..."
git push -u origin main

echo "✅ ¡Repositorio creado exitosamente!"
echo "🔗 URL: https://github.com/Rodolfoborja/meet-analyzer"