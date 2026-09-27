# 🏭 Chat Interno GDE — Centro de Distribución

Sistema de mensajería interna en tiempo real diseñado especialmente para centros de distribución industriales. Optimizado para **Handhelds Zebra TC22** (bodegueros sin celular), Laptops y Dispositivos Móviles (Líderes de Equipo, Supervisores e IT).

![Docker](https://img.shields.io/badge/Docker-2026-blue?logo=docker)
![Node.js](https://img.shields.io/badge/Node.js-20-green?logo=node.js)
![React](https://img.shields.io/badge/React-18-blue?logo=react)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)
![PWA Ready](https://img.shields.io/badge/PWA-Zebra%20TC22-purple)

---

## 🌟 Características Principales

- ⚡ **Mensajería en Tiempo Real (Socket.io)**: Latencia ultra-baja y **Optimistic UI Updates** para envíos instantáneos.
- 🏷️ **Menciones `@usuario`**: Autocompletado inteligente con menú flotante, navegación por teclado y alertas doradas de mensajes donde fuiste mencionado.
- 📱 **Modo App Nativa PWA (Zebra TC22)**: Configurado con `manifest.json` (`display: standalone`) y Service Worker para resistencia a zonas muertas sin señal Wi-Fi en bodega.
- 🖼️ **Visor Modal Multimedia**: Inspección de fotos de mercancías/daños con **Zoom hasta 400%**, rotación de 90° y lectura integrada de documentos PDF.
- 🛡️ **Panel de Administración (`/admin`)**: Gestión completa de Usuarios (crear, editar, roles, equipos) y creación/asignación de Equipos de trabajo.
- 🔐 **Matriz Estricta de Permisos por Rol**:
  - **Bodegueros**: Comunicación limitada a su Líder de Equipo y Soporte IT.
  - **Líderes de Equipo**: Comunicación con sus Bodegueros, otros Líderes y Supervisores.
  - **Supervisores e IT**: Comunicación abierta con todos los roles.

---

## 🛠️ Tecnologías Utilizadas

- **Frontend**: React 18 + Vite, Zustand (State Management), Vanilla CSS con Design Tokens, Web Workers (PWA).
- **Backend**: Node.js + Express, Socket.io (WebSockets), Prisma ORM.
- **Base de Datos**: PostgreSQL 16 Alpine.
- **Contenedores**: Docker + Docker Compose, Nginx (Reverse Proxy & Static Files).

---

## 🐳 Ejecución Local con Docker

1. Asegúrate de tener **Docker Desktop** iniciado.
2. Clona este repositorio:
   ```bash
   git clone https://github.com/Fernandomorales1842010/chat-interno-gde.git
   cd chat-interno-gde
   ```
3. Ejecuta el stack completo:
   ```bash
   docker-compose up --build
   ```
4. Accede a las URLs:
   - 🌐 **App / Chat**: [http://localhost](http://localhost)
   - ⚙️ **Panel Admin**: [http://localhost/admin](http://localhost/admin)

### 🔑 Credenciales de Prueba (Password: `Password123!`):
- **Admin**: `admin`
- **Supervisor**: `sup.garcia`
- **IT**: `it.lopez`
- **Líder**: `lider.perez`
- **Bodeguero**: `bod.hernandez`

---

## ☁️ Despliegue en AWS EC2

Consulta la guía detallada paso a paso en [AWS_DEPLOYMENT_GUIDE.md](./AWS_DEPLOYMENT_GUIDE.md).

```bash
# En tu instancia AWS EC2:
git clone https://github.com/Fernandomorales1842010/chat-interno-gde.git
cd chat-interno-gde
chmod +x deploy.sh
./deploy.sh
```
