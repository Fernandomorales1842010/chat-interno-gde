#!/bin/sh
set -e

echo ""
echo "🏭 ================================"
echo "   Chat Interno GDE - Backend"
echo "================================"
echo ""

echo "⏳ Esperando a que PostgreSQL esté listo..."
MAX_RETRIES=30
RETRIES=0

until node prisma/check-db.js 2>/dev/null; do
  RETRIES=$((RETRIES + 1))
  if [ $RETRIES -ge $MAX_RETRIES ]; then
    echo "❌ Error: PostgreSQL no respondió después de ${MAX_RETRIES} intentos"
    exit 1
  fi
  echo "   Intento ${RETRIES}/${MAX_RETRIES}... esperando 3 segundos"
  sleep 3
done

echo "✅ PostgreSQL disponible"
echo ""

echo "📦 Aplicando schema de base de datos..."
npx prisma db push --accept-data-loss
echo "✅ Schema aplicado"
echo ""

echo "🌱 Cargando datos iniciales (si es primera ejecución)..."
node prisma/seed.js || echo "ℹ️  Seed ya fue aplicado, continuando..."
echo ""

echo "🚀 Iniciando servidor en puerto 3001..."
exec node src/index.js
