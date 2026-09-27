#!/bin/bash
set -e

echo "🚀 ================================================"
echo "   Chat Interno GDE - Despliegue en AWS EC2"
echo "================================================"

# 1. Pull de la última versión desde GitHub
echo "📥 Actualizando repositorio desde GitHub..."
git pull origin main || git pull origin master

# 2. Reconstrucción e inicio de contenedores Docker
echo "🐳 Reconstruyendo imágenes de Docker y reiniciando servicios..."
docker compose down
docker compose up -d --build

# 3. Verificación de estado de los contenedores
echo "🔍 Verificando estado de contenedores..."
sleep 5
docker compose ps

echo ""
echo "🎉 ¡Despliegue completado exitosamente!"
echo "🌐 La aplicación está disponible en el puerto 80 / 443"
