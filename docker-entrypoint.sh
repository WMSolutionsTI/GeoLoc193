#!/bin/sh
set -e

echo "📡 Iniciando container GeoLoc193..."

# Aguardar banco de dados
echo "⏳ Aguardando PostgreSQL..."
sleep 5

# Criar pastas de uploads se não existirem
mkdir -p /app/.next/standalone/uploads
mkdir -p /app/.next/standalone/public/uploads
chmod -R 755 /app/.next/standalone/uploads /app/.next/standalone/public/uploads

echo "🚀 Iniciando Next.js standalone..."
cd /app/.next/standalone
exec node server.js
