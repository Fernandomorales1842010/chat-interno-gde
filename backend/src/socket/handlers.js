const prisma = require('../utils/prisma');
const { canCommunicateWith, Role } = require('../utils/permissions');

// Mapa de usuarios conectados: userId -> Set<socketId>
const connectedUsers = new Map();

/**
 * Registra un socket para un usuario y actualiza su estado online.
 */
const addUserSocket = async (userId, socketId) => {
  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socketId);

  await prisma.user.update({
    where: { id: userId },
    data: { isOnline: true, lastSeen: new Date() }
  }).catch(console.error);
};

/**
 * Elimina un socket de un usuario. Si no quedan sockets, lo marca offline.
 */
const removeUserSocket = async (userId, socketId) => {
  const sockets = connectedUsers.get(userId);
  if (sockets) {
    sockets.delete(socketId);
    if (sockets.size === 0) {
      connectedUsers.delete(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { isOnline: false, lastSeen: new Date() }
      }).catch(console.error);
    }
  }
};

/**
 * Configura todos los handlers de Socket.io.
 * @param {import('socket.io').Server} io
 */
const setupSocketHandlers = (io) => {
  io.on('connection', async (socket) => {
    const user = socket.user;
    console.log(`✅ Usuario conectado: ${user.fullName} (${user.role}) - Socket: ${socket.id}`);

    // Registrar conexión
    await addUserSocket(user.id, socket.id);

    // Unirse a salas de todas las conversaciones del usuario
    const userConversations = await prisma.conversationParticipant.findMany({
      where: { userId: user.id },
      select: { conversationId: true }
    });
    userConversations.forEach(({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    // Sala personal del usuario para notificaciones
    socket.join(`user:${user.id}`);

    // Notificar a todos que este usuario está online
    socket.broadcast.emit('user:online', {
      userId: user.id,
      isOnline: true,
      lastSeen: new Date()
    });

    // ─── ENVIAR MENSAJE ───────────────────────────────────────────────────────
    socket.on('message:send', async (data) => {
      try {
        const { conversationId, content, type = 'TEXT', fileUrl, fileName, fileSize, mimeType } = data;

        if (!conversationId || !content) return;

        // Verificar que el usuario es participante
        const participant = await prisma.conversationParticipant.findUnique({
          where: {
            conversationId_userId: { conversationId, userId: user.id }
          }
        });

        if (!participant) {
          socket.emit('error', { message: 'No eres participante de esta conversación' });
          return;
        }

        // Guardar mensaje en BD
        const message = await prisma.message.create({
          data: {
            conversationId,
            senderId: user.id,
            content: content.trim(),
            type,
            fileUrl,
            fileName,
            fileSize,
            mimeType,
          },
          include: {
            sender: {
              select: {
                id: true, fullName: true, username: true, role: true, avatarUrl: true
              }
            }
          }
        });

        // Actualizar timestamp de la conversación
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() }
        });

        // Emitir a todos en la sala (incluyendo el sender para confirmación)
        io.to(`conv:${conversationId}`).emit('message:new', message);

        // Emitir actualización de conversación a todos los participantes
        const participants = await prisma.conversationParticipant.findMany({
          where: { conversationId }
        });

        participants.forEach(p => {
          if (p.userId !== user.id) {
            io.to(`user:${p.userId}`).emit('conversation:update', {
              conversationId,
              lastMessage: message,
            });
          }
        });

      } catch (error) {
        console.error('message:send error:', error);
        socket.emit('error', { message: 'Error al enviar el mensaje' });
      }
    });

    // ─── TYPING INDICATOR ─────────────────────────────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        conversationId,
        userId: user.id,
        fullName: user.fullName,
        isTyping: true
      });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', {
        conversationId,
        userId: user.id,
        fullName: user.fullName,
        isTyping: false
      });
    });

    // ─── MARCAR COMO LEÍDO ────────────────────────────────────────────────────
    socket.on('message:read', async ({ conversationId }) => {
      try {
        await prisma.conversationParticipant.updateMany({
          where: { conversationId, userId: user.id },
          data: { lastReadAt: new Date() }
        });

        socket.to(`conv:${conversationId}`).emit('message:read:update', {
          conversationId,
          userId: user.id,
          readAt: new Date()
        });
      } catch (error) {
        console.error('message:read error:', error);
      }
    });

    // ─── UNIRSE A NUEVA CONVERSACIÓN ──────────────────────────────────────────
    socket.on('conversation:join', ({ conversationId }) => {
      socket.join(`conv:${conversationId}`);
    });

    // ─── DESCONEXIÓN ──────────────────────────────────────────────────────────
    socket.on('disconnect', async (reason) => {
      console.log(`❌ Usuario desconectado: ${user.fullName} - Razón: ${reason}`);
      await removeUserSocket(user.id, socket.id);

      // Solo notificar offline si no hay más sockets activos
      if (!connectedUsers.has(user.id)) {
        io.emit('user:online', {
          userId: user.id,
          isOnline: false,
          lastSeen: new Date()
        });
      }
    });
  });
};

module.exports = { setupSocketHandlers, connectedUsers };
