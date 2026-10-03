const bcrypt = require('bcryptjs');
const prisma = require('../utils/prisma');
const { canCommunicateWith, Role, isAdminRole } = require('../utils/permissions');

/**
 * GET /api/users
 * Lista usuarios disponibles para chat según el rol del solicitante.
 * Aplica la matriz de permisos de comunicación.
 */
const getUsers = async (req, res) => {
  try {
    const { role: userRole, id: userId, teamId } = req.user;
    const { search, role: filterRole, all } = req.query;

    // Si se solicita all=true y el usuario es ADMIN, SUPERVISOR o IT, devolver todos los usuarios sin restricciones de chat
    if (all === 'true' && (userRole === Role.ADMIN || userRole === Role.SUPERVISOR || userRole === Role.IT)) {
      const whereClause = {};
      if (filterRole && Object.values(Role).includes(filterRole)) {
        whereClause.role = filterRole;
      }
      if (search) {
        whereClause.OR = [
          { fullName: { contains: search, mode: 'insensitive' } },
          { username: { contains: search, mode: 'insensitive' } },
        ];
      }
      const users = await prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          username: true,
          fullName: true,
          role: true,
          teamId: true,
          avatarUrl: true,
          isOnline: true,
          lastSeen: true,
          createdAt: true,
          team: {
            select: { id: true, name: true }
          }
        },
        orderBy: [
          { role: 'asc' },
          { fullName: 'asc' }
        ]
      });
      return res.json({ success: true, data: users });
    }

    // Roles con los que puede comunicarse el usuario actual
    const allowedRoles = Object.values(Role).filter(r => canCommunicateWith(userRole, r));

    const whereClause = {
      id: { not: userId }, // Excluir al propio usuario
      role: { in: allowedRoles },
    };

    // Si el usuario es BODEGUERO, solo puede ver a su líder de equipo e IT
    if (userRole === Role.BODEGUERO) {
      whereClause.OR = [
        { role: Role.IT },
        { role: Role.ADMIN },
        {
          role: Role.TEAM_LEADER,
          ledTeam: { id: teamId } // Solo su líder (el líder de su equipo)
        }
      ];
      delete whereClause.role;
    }

    if (filterRole && allowedRoles.includes(filterRole)) {
      whereClause.role = filterRole;
    }

    if (search) {
      whereClause.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        teamId: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        team: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { isOnline: 'desc' },
        { fullName: 'asc' }
      ]
    });

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('GetUsers error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * GET /api/users/:id
 * Obtiene un usuario por ID
 */
const getUserById = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        teamId: true,
        avatarUrl: true,
        isOnline: true,
        lastSeen: true,
        team: {
          select: { id: true, name: true }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('GetUserById error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * POST /api/users
 * Crea un nuevo usuario (solo ADMIN/SUPERVISOR/IT)
 */
const createUser = async (req, res) => {
  try {
    const { username, fullName, password, role, teamId } = req.body;

    if (!username || !fullName || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'username, fullName, password y role son requeridos'
      });
    }

    if (!Object.values(Role).includes(role)) {
      return res.status(400).json({
        success: false,
        message: `Rol inválido. Roles disponibles: ${Object.values(Role).join(', ')}`
      });
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: username.toLowerCase().trim() }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya existe'
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        fullName: fullName.trim(),
        password: hashedPassword,
        role,
        teamId: teamId || null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        teamId: true,
        createdAt: true,
      }
    });

    // Agregar automáticamente al grupo General si existe
    try {
      const generalGroup = await prisma.conversation.findFirst({
        where: { name: '📢 General', isSystem: true }
      });
      if (generalGroup) {
        await prisma.conversationParticipant.create({
          data: {
            conversationId: generalGroup.id,
            userId: user.id,
            role: 'MEMBER'
          }
        });
      }
    } catch (gErr) {
      console.warn('No se pudo agregar nuevo usuario al grupo General:', gErr.message);
    }

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('CreateUser error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * PUT /api/users/:id
 * Actualiza un usuario
 */
const updateUser = async (req, res) => {
  try {
    const { fullName, role, teamId, avatarUrl } = req.body;
    const { id } = req.params;

    // Solo admin puede actualizar cualquier usuario
    // Los demás solo pueden actualizar su propio perfil
    if (!isAdminRole(req.user.role) && req.user.id !== id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar este usuario'
      });
    }

    const updateData = {};
    if (fullName) updateData.fullName = fullName.trim();
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
    
    // Solo admin puede cambiar rol y equipo
    if (isAdminRole(req.user.role)) {
      if (role) updateData.role = role;
      if (teamId !== undefined) updateData.teamId = teamId;
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        teamId: true,
        avatarUrl: true,
      }
    });

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('UpdateUser error:', error);
    res.status(500).json({ success: false, message: 'Error interno del servidor' });
  }
};

/**
 * DELETE /api/users/:id
 * Elimina un usuario (solo ADMIN)
 */
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: 'No puedes eliminar tu propio usuario de administrador' });
    }

    await prisma.$transaction([
      // Quitar como líder de equipo si aplica
      prisma.team.updateMany({ where: { leaderId: id }, data: { leaderId: null } }),
      // Remover de participantes de conversaciones
      prisma.conversationParticipant.deleteMany({ where: { userId: id } }),
      // Remover mensajes enviados por el usuario o mantener (según FK)
      prisma.message.deleteMany({ where: { senderId: id } }),
      // Eliminar el registro del usuario
      prisma.user.delete({ where: { id } })
    ]);

    res.json({ success: true, message: 'Usuario eliminado' });
  } catch (error) {
    console.error('DeleteUser error:', error);
    res.status(500).json({ success: false, message: 'Error al eliminar usuario' });
  }
};

module.exports = { getUsers, getUserById, createUser, updateUser, deleteUser };
