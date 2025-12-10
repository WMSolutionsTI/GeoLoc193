#!/bin/sh
set -e

echo "📡 Iniciando container GeoLoc193..."

# Opcional: esperar o banco responder, se for outro container ou servidor remoto
# Se quiser algo mais robusto, pode usar 'wait-for-it' ou 'nc' aqui.

echo "🔄 Rodando migrações do banco..."
if npm run db:migrate; then
  echo "✅ Migrações concluídas"
else
  echo "⚠️ Erro ou script db:migrate inexistente. Seguindo assim mesmo..." >&2
fi

echo "🌱 Rodando seed do banco..."
if npm run db:seed; then
  echo "✅ Seed concluído"
else
  echo "⚠️ Erro ou script db:seed inexistente. Seguindo assim mesmo..." >&2
fi

echo "🚀 Iniciando Next.js em modo produção..."
exec npm start
