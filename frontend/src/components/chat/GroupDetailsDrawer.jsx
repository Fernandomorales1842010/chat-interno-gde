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
  
  // Para eliminación en lote
  const [selectedForRemoval, setSelectedForRemoval] = useState(new Set());
  const [isRemoving, setIsRemoving] = useState(false);
  const [isDeletingGroup, setIsDeletingGroup] = useState(false);
  
  const { fetchConversations, setActiveConversation } = useChatStore();

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

  const handleToggleSelectRemoval = (userId) => {
    setSelectedForRemoval(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) newSet.delete(userId);
      else newSet.add(userId);
      return newSet;
    });
  };

  const handleBatchRemove = async () => {
    if (selectedForRemoval.size === 0) return;
    if (!window.confirm(`¿Eliminar a los ${selectedForRemoval.size} miembros seleccionados?`)) return;
    
    setIsRemoving(true);
    try {
      await api.post(`/conversations/${conversation.id}/members/remove`, {
        userIds: Array.from(selectedForRemoval)
      });
      await fetchConversations();
      setSelectedForRemoval(new Set()); // limpiar selección
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar miembros');
    } finally {
      setIsRemoving(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!window.confirm('¿Estás seguro de eliminar este grupo permanentemente? Se borrarán todos los mensajes y la acción no se puede deshacer.')) return;
    setIsDeletingGroup(true);
    try {
      await api.delete(`/conversations/${conversation.id}`);
      setActiveConversation(null); // Deseleccionar
      await fetchConversations();
      onClose(); // Cerrar drawer
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar el grupo');
      setIsDeletingGroup(false);
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
            
            {/* Botón para eliminar grupo completo */}
            {isAdmin && !conversation.isSystem && (
              <button 
                className="btn-action delete" 
                style={{ marginTop: 16, width: '100%' }}
                onClick={handleDeleteGroup}
                disabled={isDeletingGroup}
              >
                {isDeletingGroup ? 'Eliminando...' : '🗑️ Eliminar Grupo Completo'}
              </button>
            )}
          </div>

          <hr className="drawer-divider" />

          {/* Acciones de grupo */}
          {isAdmin && !conversation.isSystem && (
            <div style={{ padding: '0 16px 12px', display: 'flex', gap: 8 }}>
              <button
                className="btn-primary"
                style={{ flex: 1, fontSize: 13, padding: '8px 12px' }}
                onClick={() => {
                  setShowAddMember(!showAddMember);
                  setSelectedForRemoval(new Set()); // Limpiar selección si cambia vista
                }}
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
                <div className="drawer-section-title" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>MIEMBROS ({filteredParticipants.length})</span>
                  {isAdmin && selectedForRemoval.size > 0 && (
                    <button 
                      className="btn-action delete"
                      style={{ fontSize: 11, padding: '4px 8px' }}
                      onClick={handleBatchRemove}
                      disabled={isRemoving}
                    >
                      {isRemoving ? '...' : `🗑️ Eliminar (${selectedForRemoval.size})`}
                    </button>
                  )}
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
                      const isSelected = selectedForRemoval.has(memberId);

                      return (
                        <div key={p.id || memberId} className="participant-item" style={{ cursor: isAdmin && !isYou && !conversation.isSystem ? 'pointer' : 'default', background: isSelected ? 'var(--color-bg-active)' : 'transparent' }} onClick={() => {
                          if (isAdmin && !isYou && !conversation.isSystem) {
                            handleToggleSelectRemoval(memberId);
                          }
                        }}>
                          {isAdmin && !isYou && !conversation.isSystem && (
                            <div style={{ marginRight: 8 }}>
                              <input 
                                type="checkbox" 
                                checked={isSelected}
                                onChange={() => {}} 
                                style={{ pointerEvents: 'none' }} 
                              />
                            </div>
                          )}
                          <Avatar 
                            user={p.user} 
                            showOnline 
                            isOnline={p.user?.isOnline} 
                          />
                          <div className="participant-info" style={{ marginLeft: (!isAdmin || isYou || conversation.isSystem) ? 0 : 4 }}>
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
