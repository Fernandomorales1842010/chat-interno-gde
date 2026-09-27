const jwt = require('jsonwebtoken');
const prisma = require('../utils/prisma');

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer del header Authorization.
 */
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Token de acceso requerido' 
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        teamId: true,
        avatarUrl: true,
        isOnline: true,
      }
    });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Usuario no encontrado' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: 'Token expirado, inicia sesión de nuevo' 
      });
    }
    return res.status(401).json({ 
      success: false, 
      message: 'Token inválido' 
    });
  }
};

/**
 * Middleware de autorización por roles.
 * @param {...string} roles - Roles permitidos
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'No autenticado' 
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'No tienes permisos para esta acción' 
      });
    }

    next();
  };
};

/**
 * Verifica token de Socket.io
 */
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;

    if (!token) {
      return next(new Error('Token requerido'));
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        username: true,
        fullName: true,
        role: true,
        teamId: true,
        avatarUrl: true,
      }
    });

    if (!user) {
      return next(new Error('Usuario no encontrado'));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error('Token inválido'));
  }
};

module.exports = { authenticate, authorize, authenticateSocket };
