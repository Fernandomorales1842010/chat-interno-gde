const prisma = require('../utils/prisma');

/**
 * GET /api/messages/:conversationId
 * Obtiene mensajes paginados de una conversación
 */
const getMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const { cursor, limit = 50 } = req.query;

    // Verificar que el usuario es participante
    const participant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: { conversationId, userId }
      }
    });

    if (!participant) {
      return res.status(403).json({
        success: false,
        message: 'No eres participante de esta conversación'
      });
    }

    const take = Math.min(Number(limit), 100); // Max 100 mensajes por página

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
        isDeleted: false,
        ...(cursor ? { createdAt: { lt: new Date(cursor) } } : {})
      },
      include: {
        sender: {
          select: {
            id: true,
            fullName: true,
            username: true,
            role: true,
            avatarUrl: true,
          }
        },
        reads: {
          select: {
            userId: true,
            readAt: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take,
    });

    // Marcar mensajes como leídos automáticamente
    await prisma.conversationParticipant.updateMany({
      where: { conversationId, userId },
      data: { lastReadAt: new Date() }
    });

    res.json({
      success: true,
      data: messages.reverse(), // Ordenar cronológicamente
      hasMore: messages.length === take,
      nextCursor: messages.length > 0 ? messages[0].createdAt.toISOString() : null
    });
  } catch (error) {
    console.error('GetMessages error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/messages/:id
 * Elimina un mensaje (solo el autor o ADMIN)
 */
const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.message.findUnique({ where: { id } });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Mensaje no encontrado' });
    }

    if (message.senderId !== userId && !['ADMIN', 'SUPERVISOR'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'No puedes eliminar este mensaje' });
    }

    await prisma.message.update({
      where: { id },
      data: { isDeleted: true, content: 'Mensaje eliminado' }
    });

    res.json({ success: true, message: 'Mensaje eliminado' });
  } catch (error) {
    console.error('DeleteMessage error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { getMessages, deleteMessage };
