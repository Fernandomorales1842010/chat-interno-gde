import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore';
import useChatStore from '../store/chatStore';

// Si VITE_SOCKET_URL está vacío, Socket.io usará el origen actual del navegador
// (en Docker, Nginx hace el proxy de /socket.io al backend automáticamente)
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;


let socket = null;

/**
 * Hook que gestiona la conexión de Socket.io.
 * Se conecta cuando el usuario está autenticado y se desconecta al salir.
 */
const useSocket = () => {
  const { user, token } = useAuthStore();
  const { addMessage, setTyping, updateUserOnlineStatus, addConversation } = useChatStore();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!token || !user) return;

    // Conectar socket
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Socket conectado:', socket.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason);
    });

    socket.on('connect_error', (err) => {
      console.error('🔌 Error de conexión:', err.message);
    });

    // Nuevo mensaje
    socket.on('message:new', (message) => {
      addMessage(message);
    });

    // Indicador de typing
    socket.on('typing:update', ({ conversationId, userId, fullName, isTyping }) => {
      setTyping(conversationId, userId, fullName, isTyping);
    });

    // Estado online/offline
    socket.on('user:online', ({ userId, isOnline, lastSeen }) => {
      updateUserOnlineStatus(userId, isOnline, lastSeen);
    });

    // Actualización de conversación (nuevo mensaje en chat no activo)
    socket.on('conversation:update', ({ conversationId }) => {
      // La store se encarga de actualizar el unread count en addMessage
    });

    return () => {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
    };
  }, [token, user]);

  return socketRef;
};

/**
 * Envía un mensaje via socket
 */
export const sendMessage = (data) => {
  if (socket?.connected) {
    socket.emit('message:send', data);
  }
};

/**
 * Emite evento de typing
 */
export const emitTyping = (conversationId, isTyping) => {
  if (socket?.connected) {
    socket.emit(isTyping ? 'typing:start' : 'typing:stop', { conversationId });
  }
};

/**
 * Emite evento de lectura
 */
export const emitRead = (conversationId) => {
  if (socket?.connected) {
    socket.emit('message:read', { conversationId });
  }
};

/**
 * Une el socket a una sala de conversación
 */
export const joinConversation = (conversationId) => {
  if (socket?.connected) {
    socket.emit('conversation:join', { conversationId });
  }
};

export { socket };
export default useSocket;
