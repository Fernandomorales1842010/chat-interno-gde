const prisma = require('../utils/prisma');
const { canCommunicateWith, canCreateGroup, Role, isAdminRole } = require('../utils/permissions');

/**
 * GET /api/conversations
 * Lista todas las conversaciones del usuario autenticado
 */
const getConversations = async (req, res) => {
  try {
    const userId = req.user.id;

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId }
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true,
                fullName: true,
                username: true,
                role: true,
                avatarUrl: true,
                isOnline: true,
                lastSeen: true,
              }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: {
              select: { id: true, fullName: true }
            }
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    // Agregar contador de mensajes no leídos
    const conversationsWithUnread = await Promise.all(
      conversations.map(async (conv) => {
        const participant = conv.participants.find(p => p.userId === userId);
        const lastReadAt = participant?.lastReadAt;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
          }
        });

        return { ...conv, unreadCount };
      })
    );

    res.json({ success: true, data: conversationsWithUnread });
  } catch (error) {
    console.error('GetConversations error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/conversations/direct
 * Crea o retorna una conversación directa entre dos usuarios
 */
const getOrCreateDirect = async (req, res) => {
  try {
    const { targetUserId } = req.body;
    const userId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'targetUserId es requerido' });
    }

    if (targetUserId === userId) {
      return res.status(400).json({ success: false, message: 'No puedes chatear contigo mismo' });
    }

    // Obtener info del usuario destino
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, role: true, fullName: true, teamId: true }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    // Verificar permisos de comunicación
    const canTalk = canCommunicateWith(req.user.role, targetUser.role);

    // Verificar restricción especial de bodeguero
    if (req.user.role === Role.BODEGUERO && targetUser.role === Role.TEAM_LEADER) {
      // El líder destino debe ser el líder del equipo del bodeguero
      const senderTeam = await prisma.team.findUnique({
        where: { id: req.user.teamId || '' },
        select: { leaderId: true }
      });
      if (!senderTeam || senderTeam.leaderId !== targetUserId) {
        return res.status(403).json({
          success: false,
          message: 'Solo puedes chatear con el líder de tu equipo'
        });
      }
    }

    if (!canTalk) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para chatear con este usuario'
      });
    }

    // Buscar conversación directa existente
    const existing = await prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId } } },
          { participants: { some: { userId: targetUserId } } },
        ]
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, fullName: true, username: true,
                role: true, avatarUrl: true, isOnline: true, lastSeen: true
              }
            }
          }
        }
      }
    });

    if (existing) {
      return res.json({ success: true, data: existing, isNew: false });
    }

    // Crear nueva conversación directa
    const conversation = await prisma.conversation.create({
      data: {
        type: 'DIRECT',
        participants: {
          create: [
            { userId, role: 'MEMBER' },
            { userId: targetUserId, role: 'MEMBER' }
          ]
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, fullName: true, username: true,
                role: true, avatarUrl: true, isOnline: true, lastSeen: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ success: true, data: conversation, isNew: true });
  } catch (error) {
    console.error('GetOrCreateDirect error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/conversations/group
 * Crea un grupo nuevo
 */
const createGroup = async (req, res) => {
  try {
    const { name, description, participantIds, avatarUrl } = req.body;
    const userId = req.user.id;

    if (!canCreateGroup(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Tu rol no permite crear grupos'
      });
    }

    if (!name || !participantIds || participantIds.length < 1) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y al menos un participante son requeridos'
      });
    }

    // Verificar que el creador pueda comunicarse con todos los participantes
    const participants = await prisma.user.findMany({
      where: { id: { in: participantIds } },
      select: { id: true, role: true }
    });

    for (const participant of participants) {
      if (!canCommunicateWith(req.user.role, participant.role)) {
        return res.status(403).json({
          success: false,
          message: `No puedes añadir usuarios con rol ${participant.role} a este grupo`
        });
      }
    }

    // Todos los IDs de participantes (incluyendo el creador)
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    const conversation = await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name: name.trim(),
        description: description?.trim(),
        avatarUrl,
        participants: {
          create: allParticipantIds.map(pId => ({
            userId: pId,
            role: pId === userId ? 'ADMIN' : 'MEMBER'
          }))
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, fullName: true, username: true,
                role: true, avatarUrl: true, isOnline: true
              }
            }
          }
        }
      }
    });

    res.status(201).json({ success: true, data: conversation });
  } catch (error) {
    console.error('CreateGroup error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/conversations/:id
 * Obtiene detalles de una conversación
 */
const getConversation = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: {
        id,
        participants: { some: { userId } }
      },
      include: {
        participants: {
          include: {
            user: {
              select: {
                id: true, fullName: true, username: true,
                role: true, avatarUrl: true, isOnline: true, lastSeen: true
              }
            }
          }
        }
      }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversación no encontrada' });
    }

    res.json({ success: true, data: conversation });
  } catch (error) {
    console.error('GetConversation error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/conversations/:id/participants
 * Agrega participantes a un grupo (solo admin del grupo o SUPERVISOR/IT/ADMIN)
 */
const addParticipants = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds } = req.body;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id, type: 'GROUP' },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }

    const userParticipant = conversation.participants.find(p => p.userId === userId);
    if (!userParticipant || (userParticipant.role !== 'ADMIN' && !isAdminRole(req.user.role))) {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden agregar participantes' });
    }

    const existingIds = conversation.participants.map(p => p.userId);
    const newIds = userIds.filter(id => !existingIds.includes(id));

    if (newIds.length === 0) {
      return res.json({ success: true, message: 'Todos los usuarios ya son participantes' });
    }

    await prisma.conversationParticipant.createMany({
      data: newIds.map(uid => ({ conversationId: id, userId: uid, role: 'MEMBER' }))
    });

    res.json({ success: true, message: `${newIds.length} participante(s) agregado(s)` });
  } catch (error) {
    console.error('AddParticipants error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/conversations/:id/read
 * Marca la conversación como leída
 */
const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    await prisma.conversationParticipant.updateMany({
      where: { conversationId: id, userId },
      data: { lastReadAt: new Date() }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('MarkAsRead error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/conversations/:id/members
 * Agrega un miembro individual a un grupo
 */
const addMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId: targetUserId } = req.body;
    const userId = req.user.id;

    if (!targetUserId) {
      return res.status(400).json({ success: false, message: 'userId es requerido' });
    }

    const conversation = await prisma.conversation.findFirst({
      where: { id, type: 'GROUP' },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }

    // Verificar que el solicitante es admin del grupo o admin del sistema
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    if (!userParticipant || (userParticipant.role !== 'ADMIN' && !isAdminRole(req.user.role))) {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden agregar miembros' });
    }

    // Verificar que no está ya en el grupo
    const alreadyIn = conversation.participants.find(p => p.userId === targetUserId);
    if (alreadyIn) {
      return res.json({ success: true, message: 'El usuario ya es miembro del grupo' });
    }

    await prisma.conversationParticipant.create({
      data: { conversationId: id, userId: targetUserId, role: 'MEMBER' }
    });

    res.json({ success: true, message: 'Miembro agregado exitosamente' });
  } catch (error) {
    console.error('AddMember error:', error);
    res.status(500).json({ success: false, message: 'Error al agregar miembro' });
  }
};

/**
 * DELETE /api/conversations/:id/members/:userId
 * Elimina un miembro de un grupo
 */
const removeMember = async (req, res) => {
  try {
    const { id, userId: targetUserId } = req.params;
    const userId = req.user.id;

    const conversation = await prisma.conversation.findFirst({
      where: { id, type: 'GROUP' },
      include: { participants: true }
    });

    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Grupo no encontrado' });
    }

    // Verificar permisos
    const userParticipant = conversation.participants.find(p => p.userId === userId);
    if (!userParticipant || (userParticipant.role !== 'ADMIN' && !isAdminRole(req.user.role))) {
      return res.status(403).json({ success: false, message: 'Solo los administradores pueden eliminar miembros' });
    }

    // No puede eliminarse a sí mismo
    if (targetUserId === userId) {
      return res.status(400).json({ success: false, message: 'No puedes eliminarte a ti mismo del grupo' });
    }

    await prisma.conversationParticipant.deleteMany({
      where: { conversationId: id, userId: targetUserId }
    });

    res.json({ success: true, message: 'Miembro eliminado del grupo' });
  } catch (error) {
    console.error('RemoveMember error:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar miembro' });
  }
};

module.exports = {
  getConversations,
  getOrCreateDirect,
  createGroup,
  getConversation,
  addParticipants,
  markAsRead,
  addMember,
  removeMember
};

