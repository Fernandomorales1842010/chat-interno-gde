# ☁️ Guía de Despliegue en AWS (Amazon EC2 / Lightsail)

Esta guía detalla paso a paso cómo desplegar la plataforma **Chat Interno GDE** en una instancia de Amazon Web Services (AWS EC2 o AWS Lightsail) utilizando Docker y Docker Compose.

---

## 📋 Requisitos Previos en AWS

1. **Instancia EC2 recomendada**:
   - **SO**: Ubuntu 22.04 LTS o Amazon Linux 2023.
   - **Tipo**: `t3.small` o `t3.medium` (Mínimo 2 GB RAM).
2. **Grupo de Seguridad (Security Group)**:
   - Configurar las siguientes Reglas de Entrada (*Inbound Rules*):
     - `HTTP` (Puerto `80`) → `0.0.0.0/0`
     - `HTTPS` (Puerto `443`) → `0.0.0.0/0`
     - `SSH` (Puerto `22`) → `Tu Dirección IP`

---

## 🚀 Paso 1: Conectarse a la Instancia EC2 por SSH

```bash
ssh -i "tu-clave-aws.pem" ubuntu@tu-ip-publica-ec2
```

---

## 🐳 Paso 2: Instalar Docker y Docker Compose en la Instancia

Ejecuta los siguientes comandos en la terminal de la instancia AWS:

```bash
# Actualizar el sistema e instalar Docker
sudo apt update && sudo apt upgrade -y
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Dar permisos de usuario para ejecutar Docker sin sudo
sudo usermod -aG docker $USER
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

---

## 📦 Paso 3: Clonar el Repositorio de GitHub

```bash
# Clonar el repositorio público o privado desde GitHub
git clone https://github.com/Fernandomorales1842010/chat-interno-gde.git
cd chat-interno-gde
```

---

## ⚙️ Paso 4: Configurar Variables de Entorno (Opcional)

Si deseas personalizar credenciales de PostgreSQL o JWT en producción, puedes crear el archivo `.env`:

```bash
cat <<EOT > .env
POSTGRES_USER=chat_prod_user
POSTGRES_PASSWORD=tu_password_seguro_2026
POSTGRES_DB=chat_gde_prod
JWT_SECRET=super_secret_jwt_key_gde_prod_2026
EOT
```

---

## 🔥 Paso 5: Levantar el Stack Completo en Docker

Ejecuta el script de despliegue automatizado o `docker compose`:

```bash
chmod +x deploy.sh
./deploy.sh
```

Esto descargará PostgreSQL, compilará el Backend (Node.js/Prisma), creará las migraciones y seed de base de datos automáticamente, y levantará el Frontend Nginx en el puerto 80.

---

## 🔒 Paso 6: Configurar Dominio y Certificado SSL (HTTPS con Let's Encrypt)

Para producción con dominio propio (ej. `chat.gde.com`):

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx -y

# Generar certificado de manera automatizada
sudo certbot --nginx -d chat.gde.com
```

---

## 🔄 Paso 7: Actualizaciones Futuras (CI/CD o Manual)

Cada vez que subas cambios a GitHub, solo ejecuta en la instancia AWS:

```bash
cd chat-interno-gde
./deploy.sh
```
