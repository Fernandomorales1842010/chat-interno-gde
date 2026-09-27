require('dotenv').config();
const express = require('express');
const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');

const { authenticateSocket } = require('./middleware/auth');
const { setupSocketHandlers } = require('./socket/handlers');

// Rutas
const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const conversationsRoutes = require('./routes/conversations.routes');
const messagesRoutes = require('./routes/messages.routes');
const teamsRoutes = require('./routes/teams.routes');
const uploadRoutes = require('./routes/upload.routes');

const app = express();
const httpServer = createServer(app);

// ── Configurar Socket.io ───────────────────────────────────────────────────
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Middleware de autenticación para sockets
io.use(authenticateSocket);
setupSocketHandlers(io);

// ── Middlewares Express ────────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Rutas API ──────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/conversations', conversationsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/upload', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Chat Interno GDE'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Ruta no encontrada: ${req.path}` });
});

// Error handler global
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ success: false, message: 'El archivo es demasiado grande (máximo 20MB)' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ── Iniciar Servidor ───────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log('\n🚀 ================================');
  console.log(`   Chat Interno GDE - Backend`);
  console.log(`   Servidor: http://localhost:${PORT}`);
  console.log(`   Entorno:  ${process.env.NODE_ENV || 'development'}`);
  console.log('================================\n');
});

module.exports = { app, io };
