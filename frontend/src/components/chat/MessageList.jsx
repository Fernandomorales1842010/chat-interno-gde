import { useMemo } from 'react';
import useChatStore from '../../store/chatStore';
import { 
  formatMessageTime, 
  isSameDay, 
  formatFileSize,
  detectLink 
} from '../../utils/helpers';
import { getInitials, getAvatarColor } from '../../utils/helpers';

function MessageBubble({ message, isOwn, showAvatar, showSenderName, onPreviewFile, currentUser }) {
  const isMentionedMe = !isOwn && currentUser?.username && isUserMentionedInText(message.content, currentUser.username);

  const renderContent = () => {
    switch (message.type) {
      case 'IMAGE':
        return (
          <>
            <img
              src={message.fileUrl}
              alt={message.fileName || 'Imagen'}
              className="message-image"
              onClick={() => onPreviewFile?.({
                type: 'IMAGE',
                fileUrl: message.fileUrl,
                fileName: message.fileName,
                fileSize: message.fileSize
              })}
            />
            {message.content && message.content !== message.fileName && (
              <div 
                dangerouslySetInnerHTML={{ __html: detectLink(message.content, currentUser?.username) }}
                style={{ marginTop: 4, lineHeight: '1.5' }}
              />
            )}
          </>
        );

      case 'PDF':
        return (
          <div 
            className="message-file"
            onClick={() => onPreviewFile?.({
              type: 'PDF',
              fileUrl: message.fileUrl,
              fileName: message.fileName,
              fileSize: message.fileSize
            })}
          >
            <div className="message-file-icon">📄</div>
            <div className="message-file-info">
              <div className="message-file-name">{message.fileName || 'Documento PDF'}</div>
              <div className="message-file-size">{formatFileSize(message.fileSize)}</div>
            </div>
            <span style={{ fontSize: 12, opacity: 0.7 }}>🔍</span>
          </div>
        );

      case 'SYSTEM':
        return (
          <div style={{ fontStyle: 'italic', opacity: 0.8, fontSize: 13 }}>
            {message.content}
          </div>
        );

      default:
        // Texto con detección de links y menciones
        return (
          <div 
            dangerouslySetInnerHTML={{ __html: detectLink(message.content, currentUser?.username) }}
            style={{ lineHeight: '1.5' }}
          />
        );
    }
  };

  if (message.isDeleted) {
    return (
      <div className="message-bubble" style={{ opacity: 0.5, fontStyle: 'italic' }}>
        <span>🚫 Mensaje eliminado</span>
      </div>
    );
  }

  return (
    <div className={`message-bubble ${isMentionedMe ? 'has-mention-alert' : ''}`}>
      {isMentionedMe && (
        <div className="mention-alert-banner">
          ⚠️ Te mencionaron en este mensaje
        </div>
      )}
      {!isOwn && showSenderName && (
        <div className="message-sender-name">{message.sender?.fullName}</div>
      )}
      {renderContent()}
      <div className="message-time">
        {formatMessageTime(message.createdAt)}
        {isOwn && <span style={{ marginLeft: 4 }}>✓</span>}
      </div>
    </div>
  );
}

function DateSeparator({ date }) {
  const label = useMemo(() => {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    if (isSameDay(d, today)) return 'Hoy';
    if (isSameDay(d, yesterday)) return 'Ayer';
    return d.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' });
  }, [date]);

  return <div className="date-separator">{label}</div>;
}

export default function MessageList({ messages, currentUserId, currentUser, isLoading, messagesEndRef, onPreviewFile }) {
  if (isLoading && messages.length === 0) {
    return (
      <div className="messages-container" style={{ justifyContent: 'center', alignItems: 'center' }}>
        <div className="spinner" />
      </div>
    );
  }

  return (
    <div className="messages-container">
      {messages.map((message, index) => {
        const isOwn = message.senderId === currentUserId;
        const prevMessage = messages[index - 1];
        const showDateSeparator = !prevMessage || !isSameDay(prevMessage.createdAt, message.createdAt);
        const showAvatar = !isOwn && (!prevMessage || prevMessage.senderId !== message.senderId || showDateSeparator);
        const showSenderName = showAvatar;

        const initials = getInitials(message.sender?.fullName);
        const bgColor = getAvatarColor(message.sender?.fullName || '');

        return (
          <div key={message.id}>
            {showDateSeparator && <DateSeparator date={message.createdAt} />}
            <div className={`message-wrapper ${isOwn ? 'own' : ''}`}>
              {!isOwn && (
                <div style={{ width: 32, flexShrink: 0 }}>
                  {showAvatar && (
                    <div 
                      className="avatar avatar-sm"
                      style={{ background: bgColor }}
                      title={message.sender?.fullName}
                    >
                      {message.sender?.avatarUrl ? (
                        <img src={message.sender.avatarUrl} alt="" />
                      ) : initials}
                    </div>
                  )}
                </div>
              )}
              <MessageBubble
                message={message}
                isOwn={isOwn}
                showAvatar={showAvatar}
                showSenderName={showSenderName && messages.find(m => m.conversationId)?.type !== 'DIRECT'}
                onPreviewFile={onPreviewFile}
                currentUser={currentUser}
              />
            </div>
          </div>
        );
      })}

      <div ref={messagesEndRef} />
    </div>
  );
}
