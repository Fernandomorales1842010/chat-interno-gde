import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { 
  getConversationName, 
  getOtherParticipant, 
  formatConvTime,
  getRoleLabel
} from '../../utils/helpers';
import Avatar from '../shared/Avatar';
import CreateGroupModal from './CreateGroupModal';
import NewDirectChatModal from './NewDirectChatModal';

export default function Sidebar({ isMobileOpen, onClose }) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { 
    conversations, 
    activeConversationId, 
    setActiveConversation,
    fetchConversations,
    typingUsers,
    markAsRead
  } = useChatStore();

  const [tab, setTab] = useState('chats'); // 'chats' | 'groups'
  const [search, setSearch] = useState('');
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showNewDirect, setShowNewDirect] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);

  useEffect(() => {
    fetchConversations();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, []);

  const handleInstallPWA = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then(() => {
        setDeferredPrompt(null);
      });
    }
  };

  const handleSelectConversation = (conv) => {
    setActiveConversation(conv.id);
    markAsRead(conv.id);
    onClose?.(); // cerrar sidebar en mobile
  };

  // Filtrar conversaciones por tab y búsqueda
  const filtered = conversations.filter(conv => {
    const name = getConversationName(conv, user?.id).toLowerCase();
    const matchesSearch = name.includes(search.toLowerCase());
    const isGroup = conv.type === 'GROUP';
    
    if (tab === 'chats') return matchesSearch && !isGroup;
    if (tab === 'groups') return matchesSearch && isGroup;
    return matchesSearch;
  });

  // Total de no leídos para el badge de cada tab
  const unreadChats = conversations.filter(c => c.type !== 'GROUP' && c.unreadCount > 0).length;
  const unreadGroups = conversations.filter(c => c.type === 'GROUP' && c.unreadCount > 0).length;

  return (
    <>
      <div className={`sidebar ${isMobileOpen ? 'mobile-open' : ''}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">🏭</div>
            <div className="sidebar-brand-name">Chat GDE</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              <button 
                id="new-direct-chat-btn"
                className="icon-btn"
                onClick={() => setShowNewDirect(true)}
                title="Nuevo chat directo"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                  <line x1="12" y1="8" x2="12" y2="14"/><line x1="9" y1="11" x2="15" y2="11"/>
                </svg>
              </button>
              {['SUPERVISOR', 'IT', 'ADMIN', 'TEAM_LEADER'].includes(user?.role) && (
                <button 
                  id="create-group-btn"
                  className="icon-btn"
                  onClick={() => setShowCreateGroup(true)}
                  title="Crear grupo"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                    <circle cx="9" cy="7" r="4"/>
                    <line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/>
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Búsqueda */}
          <div className="search-bar" style={{ marginBottom: 10 }}>
            <div className="search-bar-icon">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
            <input
              id="sidebar-search"
              type="search"
              placeholder="Buscar conversación..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Tabs */}
          <div className="sidebar-nav">
            <button
              id="tab-chats"
              className={`sidebar-nav-btn ${tab === 'chats' ? 'active' : ''}`}
              onClick={() => setTab('chats')}
            >
              💬 Chats {unreadChats > 0 && <span className="badge">{unreadChats}</span>}
            </button>
            <button
              id="tab-groups"
              className={`sidebar-nav-btn ${tab === 'groups' ? 'active' : ''}`}
              onClick={() => setTab('groups')}
            >
              👥 Grupos {unreadGroups > 0 && <span className="badge">{unreadGroups}</span>}
            </button>
          </div>
        </div>

        {/* Lista de conversaciones */}
        <div className="sidebar-list">
          {filtered.length === 0 ? (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              {search ? 'Sin resultados' : tab === 'chats' ? 'No tienes chats directos aún' : 'No hay grupos disponibles'}
            </div>
          ) : (
            filtered.map(conv => {
              const isGroup = conv.type === 'GROUP';
              const name = getConversationName(conv, user?.id);
              const otherUser = isGroup ? null : getOtherParticipant(conv, user?.id);
              const lastMessage = conv.messages?.[0];
              const isActive = activeConversationId === conv.id;
              const typing = typingUsers[conv.id];
              const typingNames = typing ? Object.values(typing).map(t => t.fullName.split(' ')[0]) : [];
              const previewText = typingNames.length > 0
                ? `${typingNames[0]} está escribiendo...`
                : lastMessage?.content || '';

              return (
                <div
                  key={conv.id}
                  id={`conv-${conv.id}`}
                  className={`conv-item ${isActive ? 'active' : ''}`}
                  onClick={() => handleSelectConversation(conv)}
                >
                  <Avatar
                    user={isGroup ? null : otherUser}
                    name={name}
                    isGroup={isGroup}
                    showOnline={!isGroup}
                    isOnline={otherUser?.isOnline}
                  />
                  <div className="conv-item-info">
                    <div className="conv-item-name">{name}</div>
                    <div 
                      className="conv-item-preview"
                      style={typingNames.length > 0 ? { color: 'var(--color-accent)', fontStyle: 'italic' } : {}}
                    >
                      {previewText}
                    </div>
                  </div>
                  <div className="conv-item-meta">
                    <div className="conv-item-time">
                      {formatConvTime(conv.updatedAt)}
                    </div>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      {conv.unreadMentionsCount > 0 && (
                        <div className="mention-alert-badge" title="Te mencionaron en este chat">
                          @{conv.unreadMentionsCount}
                        </div>
                      )}
                      {conv.unreadCount > 0 && (
                        <div className="badge">{conv.unreadCount > 99 ? '99+' : conv.unreadCount}</div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Banner de Instalación PWA para Zebra TC22 */}
        {deferredPrompt && (
          <div style={{ padding: '8px 12px', background: 'var(--color-accent-light)', borderTop: '1px solid var(--color-border)' }}>
            <button 
              className="btn-primary" 
              onClick={handleInstallPWA}
              style={{ width: '100%', fontSize: 12, padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
            >
              📱 Instalar App en Handheld
            </button>
          </div>
        )}

        {/* Usuario actual en el footer */}
        <div className="sidebar-user">
          <Avatar user={user} showOnline isOnline={true} />
          <div className="sidebar-user-info">
            <div className="sidebar-user-name">{user?.fullName}</div>
            <div className="sidebar-user-role">
              <span className={`role-badge ${user?.role}`}>{getRoleLabel(user?.role)}</span>
            </div>
          </div>
          {['ADMIN', 'SUPERVISOR', 'IT'].includes(user?.role) && (
            <button
              id="admin-panel-btn"
              className="icon-btn"
              onClick={() => navigate('/admin')}
              title="Panel de Administración"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          )}
          <button 
            id="logout-btn"
            className="icon-btn"
            onClick={logout}
            title="Cerrar sesión"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Modales */}
      {showCreateGroup && (
        <CreateGroupModal onClose={() => setShowCreateGroup(false)} />
      )}
      {showNewDirect && (
        <NewDirectChatModal onClose={() => setShowNewDirect(false)} />
      )}
    </>
  );
}
