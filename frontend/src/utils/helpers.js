/**
 * Genera las iniciales de un nombre completo
 */
export const getInitials = (fullName = '') => {
  return fullName
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase();
};

/**
 * Genera un color de avatar basado en el nombre
 */
const AVATAR_COLORS = [
  'linear-gradient(135deg, #4f8ef7, #5b6ef5)',
  'linear-gradient(135deg, #10b981, #059669)',
  'linear-gradient(135deg, #f59e0b, #d97706)',
  'linear-gradient(135deg, #8b5cf6, #7c3aed)',
  'linear-gradient(135deg, #ef4444, #dc2626)',
  'linear-gradient(135deg, #ec4899, #db2777)',
  'linear-gradient(135deg, #06b6d4, #0891b2)',
];

export const getAvatarColor = (name = '') => {
  const index = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[index];
};

/**
 * Formatea el timestamp de un mensaje
 */
export const formatMessageTime = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
};

/**
 * Formatea la fecha del último mensaje en el sidebar
 */
export const formatConvTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  } else if (diffDays === 1) {
    return 'Ayer';
  } else if (diffDays < 7) {
    return date.toLocaleDateString('es-MX', { weekday: 'short' });
  } else {
    return date.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit' });
  }
};

/**
 * Formatea el tamaño de un archivo
 */
export const formatFileSize = (bytes) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Determina si dos fechas son el mismo día
 */
export const isSameDay = (date1, date2) => {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  return d1.toDateString() === d2.toDateString();
};

/**
 * Etiqueta del rol en español
 */
const ROLE_LABELS = {
  BODEGUERO: 'Bodeguero',
  TEAM_LEADER: 'Líder de Equipo',
  SUPERVISOR: 'Supervisor',
  IT: 'IT',
  ADMIN: 'Admin',
};

export const getRoleLabel = (role) => ROLE_LABELS[role] || role;

/**
 * Detecta si la cadena contiene una URL o menciones @usuario y genera HTML formateado
 */
export const detectLink = (text, currentUsername = '') => {
  if (!text) return '';
  // Escapar HTML básico para prevenir XSS
  let safeText = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 1. Reemplazar URLs con <a>
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  safeText = safeText.replace(urlRegex, (url) => 
    `<a href="${url}" target="_blank" rel="noopener noreferrer" class="chat-link">${url}</a>`
  );

  // 2. Reemplazar menciones @usuario
  const mentionRegex = /@([a-zA-Z0-9._-]+)/g;
  safeText = safeText.replace(mentionRegex, (match, username) => {
    const isMe = currentUsername && username.toLowerCase() === currentUsername.toLowerCase();
    return `<span class="mention-chip ${isMe ? 'is-me' : ''}">${match}</span>`;
  });

  return safeText;
};

/**
 * Verifica si un texto contiene una mención directa al usuario actual (@username)
 */
export const isUserMentionedInText = (text = '', username = '') => {
  if (!text || !username) return false;
  const regex = new RegExp(`@${username.toLowerCase()}\\b`, 'i');
  return regex.test(text);
};

/**
 * Nombre de la conversación para el otro participante (DM)
 */
export const getConversationName = (conversation, currentUserId) => {
  if (conversation.type === 'GROUP') return conversation.name;
  const other = conversation.participants?.find(p => p.user?.id !== currentUserId);
  return other?.user?.fullName || 'Chat Directo';
};

/**
 * Obtiene el otro usuario en una conversación directa
 */
export const getOtherParticipant = (conversation, currentUserId) => {
  if (conversation.type === 'GROUP') return null;
  return conversation.participants?.find(p => p.user?.id !== currentUserId)?.user;
};
