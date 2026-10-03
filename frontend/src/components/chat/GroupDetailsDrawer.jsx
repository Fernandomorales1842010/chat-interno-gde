import { useState, useEffect } from 'react';
import { getRoleLabel } from '../../utils/helpers';
import Avatar from '../shared/Avatar';
import api from '../../services/api';
import useChatStore from '../../store/chatStore';

export default function GroupDetailsDrawer({ conversation, currentUserId, onClose }) {
  const [search, setSearch] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [addingUserId, setAddingUserId] = useState(null);
  const [removingUserId, setRemovingUserId] = useState(null);
  const { fetchConversations } = useChatStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Cargar usuarios disponibles para agregar
  useEffect(() => {
    if (showAddMember) {
      api.get('/users?all=true').then(res => {
        if (res.data.success) {
          const participantIds = new Set((conversation.participants || []).map(p => p.userId || p.user?.id));
          setAvailableUsers(res.data.data.filter(u => !participantIds.has(u.id)));
        }
      }).catch(() => {});
    }
  }, [showAddMember, conversation.participants]);

  if (!conversation) return null;

  const participants = conversation.participants || [];
  const filteredParticipants = participants.filter(p => {
    const name = p.user?.fullName?.toLowerCase() || '';
    const username = p.user?.username?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || username.includes(q);
  });

  const isAdmin = participants.find(p => (p.userId || p.user?.id) === currentUserId)?.role === 'ADMIN';

  const handleAddMember = async (userId) => {
    setAddingUserId(userId);
    try {
      await api.post(`/conversations/${conversation.id}/members`, { userId });
      await fetchConversations();
      setAvailableUsers(prev => prev.filter(u => u.id !== userId));
    } catch (err) {
      alert(err.response?.data?.message || 'Error al agregar miembro');
    } finally {
      setAddingUserId(null);
    }
  };

  const handleRemoveMember = async (userId, fullName) => {
    if (!window.confirm(`¿Eliminar a "${fullName}" del grupo?`)) return;
    setRemovingUserId(userId);
    try {
      await api.delete(`/conversations/${conversation.id}/members/${userId}`);
      await fetchConversations();
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar miembro');
    } finally {
      setRemovingUserId(null);
    }
  };

  const filteredAvailable = availableUsers.filter(u => {
    const q = search.toLowerCase();
    return u.fullName.toLowerCase().includes(q) || u.username.toLowerCase().includes(q);
  });

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="group-drawer" onClick={e => e.stopPropagation()}>
        {/* Header del Drawer */}
        <div className="drawer-header">
          <h3>Información del Grupo</h3>
          <button className="icon-btn" onClick={onClose} title="Cerrar (Esc)">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Info Principal del Grupo */}
        <div className="drawer-body">
          <div className="drawer-group-profile">
            <Avatar name={conversation.name} isGroup size="lg" />
            <h2 className="drawer-group-name">{conversation.name}</h2>
            {conversation.description && (
              <p className="drawer-group-desc">{conversation.description}</p>
            )}
            <div className="drawer-group-meta">
              <span>👥 {participants.length} Participantes</span>
              {conversation.isSystem && (
                <span className="system-group-badge">📢 Grupo Oficial</span>
              )}
            </div>
          </div>

          <hr className="drawer-divider" />

          {/* Acciones de grupo */}
          {isAdmin && !conversation.isSystem && (
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
                onClick={() => setShowAddMember(!showAddMember)}
              >
                {showAddMember ? '← Volver a miembros' : '+ Agregar Miembro'}
              </button>
            </div>
          )}

          {/* Panel para agregar miembros */}
          {showAddMember && (
            <div className="drawer-participants-section">
              <div className="drawer-section-title">
                USUARIOS DISPONIBLES ({filteredAvailable.length})
              </div>
              <div className="drawer-search-box">
                <input
                  type="search"
                  placeholder="Buscar usuario para agregar..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="drawer-search-input"
                />
              </div>
              <div className="drawer-participants-list">
                {filteredAvailable.length === 0 ? (
                  <div className="drawer-empty-search">
                    No hay más usuarios para agregar
                  </div>
                ) : (
                  filteredAvailable.map(u => (
                    <div key={u.id} className="participant-item">
                      <Avatar user={u} showOnline isOnline={u.isOnline} />
                      <div className="participant-info">
                        <div className="participant-name">{u.fullName}</div>
                        <div className="participant-sub">@{u.username}</div>
                      </div>
                      <button
                        className="btn-primary"
                        style={{ fontSize: 11, padding: '4px 10px', minWidth: 'auto' }}
                        onClick={() => handleAddMember(u.id)}
                        disabled={addingUserId === u.id}
                      >
                        {addingUserId === u.id ? '...' : '+ Agregar'}
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Lista de Participantes normales */}
          {!showAddMember && (
            <>
              {/* Buscador de Participantes */}
              <div className="drawer-search-box">
                <input
                  type="search"
                  placeholder="Buscar participante..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="drawer-search-input"
                />
              </div>

              {/* Lista de Participantes */}
              <div className="drawer-participants-section">
                <div className="drawer-section-title">
                  MIEMBROS ({filteredParticipants.length})
                </div>

                <div className="drawer-participants-list">
                  {filteredParticipants.length === 0 ? (
                    <div className="drawer-empty-search">
                      Sin resultados para "{search}"
                    </div>
                  ) : (
                    filteredParticipants.map(p => {
                      const isGroupAdmin = p.role === 'ADMIN';
                      const isYou = (p.userId || p.user?.id) === currentUserId;
                      const memberId = p.userId || p.user?.id;

                      return (
                        <div key={p.id || memberId} className="participant-item">
                          <Avatar 
                            user={p.user} 
                            showOnline 
                            isOnline={p.user?.isOnline} 
                          />
                          <div className="participant-info">
                            <div className="participant-name">
                              {p.user?.fullName} {isYou && <span className="you-tag">(Tú)</span>}
                            </div>
                            <div className="participant-sub">
                              @{p.user?.username}
                            </div>
                          </div>
                          <div className="participant-badges">
                            {isGroupAdmin && (
                              <span className="group-admin-tag" title="Administrador del grupo">
                                👑 Admin
                              </span>
                            )}
                            <span className={`role-badge ${p.user?.role}`}>
                              {getRoleLabel(p.user?.role)}
                            </span>
                            {isAdmin && !isYou && !conversation.isSystem && (
                              <button
                                className="btn-action delete"
                                style={{ fontSize: 11, padding: '2px 6px', marginLeft: 4 }}
                                onClick={() => handleRemoveMember(memberId, p.user?.fullName)}
                                disabled={removingUserId === memberId}
                                title="Eliminar del grupo"
                              >
                                {removingUserId === memberId ? '...' : '✕'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
