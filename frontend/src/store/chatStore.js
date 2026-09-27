import { create } from 'zustand';
import api from '../services/api';
import useAuthStore from './authStore';
import { isUserMentionedInText } from '../utils/helpers';

const useChatStore = create((set, get) => ({
  conversations: [],
  activeConversationId: null,
  messages: {}, // { conversationId: [messages] }
  typingUsers: {}, // { conversationId: { userId: { fullName, timestamp } } }
  isLoadingConversations: false,
  isLoadingMessages: false,

  // Setear conversación activa
  setActiveConversation: (id) => set({ activeConversationId: id }),

  // Cargar lista de conversaciones
  fetchConversations: async () => {
    set({ isLoadingConversations: true });
    try {
      const res = await api.get('/conversations');
      set({ conversations: res.data.data, isLoadingConversations: false });
    } catch (error) {
      console.error('fetchConversations:', error);
      set({ isLoadingConversations: false });
    }
  },

  // Crear o abrir DM
  openDirectChat: async (targetUserId) => {
    try {
      const res = await api.post('/conversations/direct', { targetUserId });
      const conversation = res.data.data;
      
      set(state => {
        const exists = state.conversations.find(c => c.id === conversation.id);
        return {
          conversations: exists
            ? state.conversations
            : [conversation, ...state.conversations],
          activeConversationId: conversation.id,
        };
      });

      return conversation;
    } catch (error) {
      console.error('openDirectChat:', error);
      throw error;
    }
  },

  // Cargar mensajes de una conversación
  fetchMessages: async (conversationId, cursor = null) => {
    set({ isLoadingMessages: true });
    try {
      const params = { limit: 50 };
      if (cursor) params.cursor = cursor;
      
      const res = await api.get(`/messages/${conversationId}`, { params });
      const newMessages = res.data.data;

      set(state => ({
        messages: {
          ...state.messages,
          [conversationId]: cursor
            ? [...newMessages, ...(state.messages[conversationId] || [])]
            : newMessages,
        },
        isLoadingMessages: false,
      }));

      return res.data;
    } catch (error) {
      console.error('fetchMessages:', error);
      set({ isLoadingMessages: false });
    }
  },

  // Agregar mensaje nuevo (desde socket o local)
  addMessage: (message) => {
    set(state => {
      const conversationMessages = state.messages[message.conversationId] || [];
      const currentUser = useAuthStore.getState().user;
      const isMe = message.senderId === currentUser?.id;
      const isMentioned = !isMe && currentUser?.username && isUserMentionedInText(message.content, currentUser.username);
      
      // Buscar si existe un mensaje optimista temporal con el mismo contenido
      const tempIndex = conversationMessages.findIndex(m => m.isOptimistic && m.content === message.content);
      
      let updatedMessages;
      if (tempIndex !== -1) {
        // Reemplazar mensaje temporal con el confirmado del servidor
        updatedMessages = [...conversationMessages];
        updatedMessages[tempIndex] = message;
      } else if (conversationMessages.find(m => m.id === message.id)) {
        // Evitar duplicados por id
        return state;
      } else {
        updatedMessages = [...conversationMessages, message];
      }

      // Actualizar último mensaje y contadores en lista de conversaciones
      const conversations = state.conversations.map(conv => {
        if (conv.id === message.conversationId) {
          const isCurrentActive = conv.id === state.activeConversationId;
          return {
            ...conv,
            messages: [message],
            updatedAt: message.createdAt,
            unreadCount: !isCurrentActive ? (conv.unreadCount || 0) + 1 : 0,
            unreadMentionsCount: isMentioned && !isCurrentActive
              ? (conv.unreadMentionsCount || 0) + 1
              : isCurrentActive ? 0 : (conv.unreadMentionsCount || 0),
          };
        }
        return conv;
      });

      // Ordenar conversaciones por último mensaje
      conversations.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

      return {
        messages: {
          ...state.messages,
          [message.conversationId]: updatedMessages,
        },
        conversations,
      };
    });
  },

  // Enviar mensaje optimista inmediatamente en la UI para respuesta ultra-rápida
  addOptimisticMessage: (tempMessage) => {
    set(state => {
      const conversationMessages = state.messages[tempMessage.conversationId] || [];
      return {
        messages: {
          ...state.messages,
          [tempMessage.conversationId]: [...conversationMessages, { ...tempMessage, isOptimistic: true }],
        },
      };
    });
  },

  // Marcar conversación como leída
  markAsRead: async (conversationId) => {
    try {
      await api.put(`/conversations/${conversationId}/read`);
      set(state => ({
        conversations: state.conversations.map(conv =>
          conv.id === conversationId ? { ...conv, unreadCount: 0, unreadMentionsCount: 0 } : conv
        ),
      }));
    } catch {}
  },

  // Gestión de typing
  setTyping: (conversationId, userId, fullName, isTyping) => {
    set(state => {
      const conv = { ...(state.typingUsers[conversationId] || {}) };
      if (isTyping) {
        conv[userId] = { fullName, timestamp: Date.now() };
      } else {
        delete conv[userId];
      }
      return {
        typingUsers: {
          ...state.typingUsers,
          [conversationId]: conv,
        }
      };
    });
  },

  // Actualizar estado online de un usuario
  updateUserOnlineStatus: (userId, isOnline, lastSeen) => {
    set(state => ({
      conversations: state.conversations.map(conv => ({
        ...conv,
        participants: conv.participants?.map(p =>
          p.user?.id === userId
            ? { ...p, user: { ...p.user, isOnline, lastSeen } }
            : p
        ),
      })),
    }));
  },

  // Agregar nueva conversación al listado
  addConversation: (conversation) => {
    set(state => {
      const exists = state.conversations.find(c => c.id === conversation.id);
      if (exists) return state;
      return { conversations: [conversation, ...state.conversations] };
    });
  },

  // Crear grupo
  createGroup: async (data) => {
    const res = await api.post('/conversations/group', data);
    const conversation = res.data.data;
    set(state => ({
      conversations: [conversation, ...state.conversations],
      activeConversationId: conversation.id,
    }));
    return conversation;
  },
}));

export default useChatStore;
