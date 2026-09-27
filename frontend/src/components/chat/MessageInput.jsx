import { useState, useRef, useCallback, useEffect } from 'react';
import { emitTyping } from '../../hooks/useSocket';
import { formatFileSize, getRoleLabel } from '../../utils/helpers';
import useChatStore from '../../store/chatStore';
import Avatar from '../shared/Avatar';
import api from '../../services/api';

const ACCEPTED_TYPES = 'image/*,.pdf,.doc,.docx';

export default function MessageInput({ 
  conversationId,
  onSend, 
  pendingFile,
  onFileSelect,
  onFileClear,
  isUploading 
}) {
  const [text, setText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  
  // Mentions autocomplete state
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionIndex, setMentionIndex] = useState(0);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [allUsers, setAllUsers] = useState([]);
  const { conversations, activeConversationId } = useChatStore();
  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const participants = activeConversation?.participants || [];

  // Si la conversación activa no tiene participantes pre-cargados, cargar de la API
  useEffect(() => {
    if (showMentions && participants.length === 0 && allUsers.length === 0) {
      api.get('/users').then(res => {
        if (res.data.success) {
          setAllUsers(res.data.data.map(u => ({ user: u, userId: u.id })));
        }
      }).catch(() => {});
    }
  }, [showMentions, participants.length, allUsers.length]);

  const candidateParticipants = participants.length > 0 ? participants : allUsers;

  // Filtrar participantes según el texto tipeado tras el @
  const filteredParticipants = candidateParticipants.filter(p => {
    if (!p.user) return false;
    const q = mentionQuery.toLowerCase();
    return p.user.fullName.toLowerCase().includes(q) || p.user.username.toLowerCase().includes(q);
  });

  const handleTyping = useCallback(() => {
    if (!isTyping) {
      setIsTyping(true);
      emitTyping(conversationId, true);
    }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      emitTyping(conversationId, false);
    }, 2000);
  }, [conversationId, isTyping]);

  const selectMention = (user) => {
    if (!user) return;
    const lastAtIndex = text.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const newText = text.substring(0, lastAtIndex) + `@${user.username} `;
      setText(newText);
    }
    setShowMentions(false);
    setMentionQuery('');
    textareaRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (showMentions && filteredParticipants.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setMentionIndex(prev => (prev + 1) % filteredParticipants.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setMentionIndex(prev => (prev - 1 + filteredParticipants.length) % filteredParticipants.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filteredParticipants[mentionIndex]?.user);
        return;
      }
      if (e.key === 'Escape') {
        setShowMentions(false);
        return;
      }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const content = text.trim();
    if (!content && !pendingFile) return;

    onSend(content || (pendingFile?.file?.name ?? ''), 'TEXT');
    setText('');
    setIsTyping(false);
    setShowMentions(false);
    emitTyping(conversationId, false);
    clearTimeout(typingTimeoutRef.current);
    
    // Restaurar altura del textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleTextChange = (e) => {
    const value = e.target.value;
    setText(value);
    handleTyping();
    
    // Detectar si se escribió @ para desplegar el autocompletado
    const lastAtIndex = value.lastIndexOf('@');
    if (lastAtIndex !== -1) {
      const textAfterAt = value.substring(lastAtIndex + 1);
      // Solo mostrar si no hay espacios después del @
      if (!/\s/.test(textAfterAt)) {
        setMentionQuery(textAfterAt);
        setShowMentions(true);
        setMentionIndex(0);
      } else {
        setShowMentions(false);
      }
    } else {
      setShowMentions(false);
    }
    
    // Auto-resize textarea
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    
    onFileSelect({
      file,
      preview: isImage ? URL.createObjectURL(file) : null,
      type: isImage ? 'IMAGE' : isPdf ? 'PDF' : 'DOCUMENT',
    });

    // Reset input
    e.target.value = '';
  };

  const canSend = (text.trim() || pendingFile) && !isUploading;

  return (
    <div className="message-input-area" style={{ position: 'relative' }}>
      {/* Menu emergente Autocompletado Menciones @ */}
      {showMentions && filteredParticipants.length > 0 && (
        <div className="mention-autocomplete-menu">
          <div className="mention-menu-header">Mencionar participante:</div>
          {filteredParticipants.map((p, idx) => (
            <div
              key={p.userId || p.user?.id}
              className={`mention-menu-item ${idx === mentionIndex ? 'active' : ''}`}
              onClick={() => selectMention(p.user)}
            >
              <Avatar user={p.user} size="xs" />
              <div className="mention-item-info">
                <span className="mention-item-name">{p.user?.fullName}</span>
                <span className="mention-item-username">@{p.user?.username}</span>
              </div>
              <span className={`role-badge ${p.user?.role}`} style={{ fontSize: 10, padding: '1px 5px' }}>
                {getRoleLabel(p.user?.role)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Preview del archivo seleccionado */}
      {pendingFile && (
        <div className="file-preview">
          {pendingFile.preview ? (
            <img 
              src={pendingFile.preview} 
              alt="Preview" 
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} 
            />
          ) : (
            <span style={{ fontSize: 20 }}>📄</span>
          )}
          <span className="file-preview-name">{pendingFile.file?.name}</span>
          <span style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>
            {formatFileSize(pendingFile.file?.size)}
          </span>
          <button 
            className="file-preview-remove"
            onClick={onFileClear}
            title="Quitar archivo"
          >
            ✕
          </button>
        </div>
      )}

      <div className="message-input-wrapper">
        {/* Botón de archivo */}
        <div className="input-actions">
          <button
            id="attach-file-btn"
            className="icon-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Adjuntar archivo"
            type="button"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
            </svg>
          </button>
        </div>

        <textarea
          ref={textareaRef}
          id="message-input"
          className="message-input"
          placeholder="Escribe un mensaje..."
          value={text}
          onChange={handleTextChange}
          onKeyDown={handleKeyDown}
          rows={1}
          disabled={isUploading}
        />

        <div className="input-actions">
          <button
            id="send-message-btn"
            className="send-btn"
            onClick={handleSend}
            disabled={!canSend}
            title="Enviar (Enter)"
            type="button"
          >
            {isUploading ? (
              <div className="spinner" style={{ width: 16, height: 16 }} />
            ) : (
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="22" y1="2" x2="11" y2="13"/>
                <polygon points="22 2 15 22 11 13 2 9 22 2"/>
              </svg>
            )}
          </button>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        style={{ display: 'none' }}
        onChange={handleFileChange}
        id="file-upload-input"
      />
    </div>
  );
}
