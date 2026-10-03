import { useState } from 'react';
import { getConversationName, getOtherParticipant, getRoleLabel } from '../../utils/helpers';
import Avatar from '../shared/Avatar';
import GroupDetailsDrawer from './GroupDetailsDrawer';

export default function ChatHeader({ conversation, currentUserId, onOpenSidebar }) {
  const [showDrawer, setShowDrawer] = useState(false);

  if (!conversation) return null;

  const isGroup = conversation.type === 'GROUP';
  const name = getConversationName(conversation, currentUserId);
  const otherUser = isGroup ? null : getOtherParticipant(conversation, currentUserId);
  const participantCount = conversation.participants?.length || 0;

  const statusText = isGroup
    ? `${participantCount} participante${participantCount !== 1 ? 's' : ''}`
    : otherUser?.isOnline
      ? 'En línea'
      : 'Fuera de línea';

  return (
    <>
      <div className="chat-header">
        {/* Mobile: botón hamburguesa */}
        <button 
          className="mobile-hamburger-btn"
          onClick={onOpenSidebar}
          aria-label="Abrir menú"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="6" x2="21" y2="6"/>
            <line x1="3" y1="12" x2="21" y2="12"/>
            <line x1="3" y1="18" x2="21" y2="18"/>
          </svg>
        </button>

        <div 
          className="chat-header-info"
          onClick={() => isGroup && setShowDrawer(true)}
          style={{ cursor: isGroup ? 'pointer' : 'default' }}
        >
          <Avatar
            user={isGroup ? null : otherUser}
            name={name}
            isGroup={isGroup}
            showOnline={!isGroup}
            isOnline={otherUser?.isOnline}
          />
          <div>
            <div className="chat-header-name">{name}</div>
            <div className={`chat-header-status ${!isGroup && otherUser?.isOnline ? 'online' : ''}`}>
              {statusText}
              {!isGroup && otherUser?.role && (
                <span className={`role-badge ${otherUser.role}`} style={{ marginLeft: 8 }}>
                  {getRoleLabel(otherUser.role)}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="chat-header-actions">
          {isGroup && (
            <button 
              id="group-info-btn"
              className="icon-btn"
              onClick={() => setShowDrawer(true)}
              title="Info del grupo"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Drawer Deslizante de Derecha a Izquierda */}
      {showDrawer && isGroup && (
        <GroupDetailsDrawer
          conversation={conversation}
          currentUserId={currentUserId}
          onClose={() => setShowDrawer(false)}
        />
      )}
    </>
  );
}
