import { useState, useEffect, useRef, useCallback } from 'react';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { sendMessage, emitTyping, emitRead, joinConversation } from '../../hooks/useSocket';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import ChatHeader from './ChatHeader';
import MediaModalViewer from './MediaModalViewer';
import api from '../../services/api';

export default function ChatWindow({ onOpenSidebar }) {
  const { user } = useAuthStore();
  const { 
    activeConversationId, 
    conversations, 
    messages, 
    fetchMessages,
    isLoadingMessages,
    addOptimisticMessage
  } = useChatStore();

  const [pendingFile, setPendingFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);
  const messagesEndRef = useRef(null);

  const activeConversation = conversations.find(c => c.id === activeConversationId);
  const conversationMessages = messages[activeConversationId] || [];

  // Cargar mensajes al cambiar de conversación
  useEffect(() => {
    if (activeConversationId) {
      joinConversation(activeConversationId);
      fetchMessages(activeConversationId);
      emitRead(activeConversationId);
    }
  }, [activeConversationId]);

  // Auto-scroll al último mensaje
  useEffect(() => {
    if (conversationMessages.length > 0) {
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [conversationMessages.length]);

  const handleSendMessage = useCallback(async (content, type = 'TEXT') => {
    if (!activeConversationId || !content.trim()) return;

    let messageData = {
      conversationId: activeConversationId,
      content: content.trim(),
      type,
    };

    // Si hay archivo pendiente, subir primero
    if (pendingFile) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', pendingFile.file);
        const res = await api.post('/upload', formData);
        const uploaded = res.data.data;

        messageData = {
          ...messageData,
          type: uploaded.type,
          fileUrl: uploaded.url,
          fileName: uploaded.fileName,
          fileSize: uploaded.fileSize,
          mimeType: uploaded.mimeType,
        };
        setPendingFile(null);
      } catch (error) {
        console.error('Error al subir archivo:', error);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    sendMessage(messageData);
    emitTyping(activeConversationId, false);
  }, [activeConversationId, pendingFile, user, addOptimisticMessage]);

  if (!activeConversationId || !activeConversation) {
    return (
      <div className="chat-area">
        <div className="empty-chat">
          {/* Botón hamburguesa en mobile cuando no hay conversación */}
          <button 
            className="mobile-hamburger-btn"
            onClick={onOpenSidebar}
            aria-label="Abrir menú"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="empty-chat-icon">💬</div>
          <h3>Selecciona una conversación</h3>
          <p>Elige un chat de la lista para comenzar a comunicarte</p>
        </div>
      </div>
    );
  }

  return (
    <div className="chat-area">
      <ChatHeader 
        conversation={activeConversation} 
        currentUserId={user?.id} 
        onOpenSidebar={onOpenSidebar}
      />
      
      <MessageList 
        messages={conversationMessages}
        currentUserId={user?.id}
        currentUser={user}
        conversationId={activeConversationId}
        isLoading={isLoadingMessages}
        messagesEndRef={messagesEndRef}
        onPreviewFile={setPreviewFile}
      />

      <MessageInput
        conversationId={activeConversationId}
        onSend={handleSendMessage}
        pendingFile={pendingFile}
        onFileSelect={setPendingFile}
        onFileClear={() => setPendingFile(null)}
        isUploading={isUploading}
      />

      {previewFile && (
        <MediaModalViewer
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </div>
  );
}
