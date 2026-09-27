const prisma = require('../utils/prisma');
const { isAdminRole } = require('../utils/permissions');

/**
 * GET /api/teams
 * Lista todos los equipos
 */
const getTeams = async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        leader: {
          select: {
            id: true, fullName: true, username: true, role: true, avatarUrl: true
          }
        },
        members: {
          select: {
            id: true, fullName: true, username: true, role: true, avatarUrl: true, isOnline: true
          }
        }
      },
      orderBy: { name: 'asc' }
    });

    res.json({ success: true, data: teams });
  } catch (error) {
    console.error('GetTeams error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/teams
 * Crea un nuevo equipo (solo ADMIN/SUPERVISOR)
 */
const createTeam = async (req, res) => {
  try {
    const { name, leaderId, memberIds } = req.body;

    if (!name || !leaderId) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y líder son requeridos'
      });
    }

    // Verificar que el líder exista y tenga el rol correcto
    const leader = await prisma.user.findUnique({
      where: { id: leaderId },
      select: { id: true, role: true }
    });

    if (!leader || leader.role !== 'TEAM_LEADER') {
      return res.status(400).json({
        success: false,
        message: 'El líder debe tener el rol TEAM_LEADER'
      });
    }

    const team = await prisma.team.create({
      data: {
        name: name.trim(),
        leaderId,
        ...(memberIds && {
          members: {
            connect: memberIds.map(id => ({ id }))
          }
        })
      },
      include: {
        leader: {
          select: { id: true, fullName: true, username: true }
        },
        members: {
          select: { id: true, fullName: true, username: true, role: true }
        }
      }
    });

    // Actualizar el teamId del líder
    await prisma.user.update({
      where: { id: leaderId },
      data: { teamId: team.id }
    });

    // Crear automáticamente el grupo del equipo
    const allParticipantIds = [...new Set([leaderId, ...(memberIds || [])])];
    
    await prisma.conversation.create({
      data: {
        type: 'GROUP',
        name: `Equipo ${name}`,
        description: `Grupo del equipo ${name}`,
        isSystem: true,
        participants: {
          create: allParticipantIds.map(uid => ({
            userId: uid,
            role: uid === leaderId ? 'ADMIN' : 'MEMBER'
          }))
        }
      }
    });

    res.status(201).json({ success: true, data: team });
  } catch (error) {
    console.error('CreateTeam error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/teams/:id
 * Actualiza un equipo
 */
const updateTeam = async (req, res) => {
  try {
    const { name, leaderId } = req.body;
    const { id } = req.params;

    const updateData = {};
    if (name) updateData.name = name.trim();
    if (leaderId) updateData.leaderId = leaderId;

    const team = await prisma.team.update({
      where: { id },
      data: updateData,
      include: {
        leader: { select: { id: true, fullName: true } },
        members: { select: { id: true, fullName: true, role: true } }
      }
    });

    res.json({ success: true, data: team });
  } catch (error) {
    console.error('UpdateTeam error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

module.exports = { getTeams, createTeam, updateTeam };
