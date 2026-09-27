import { useState, useEffect } from 'react';
import { getRoleLabel } from '../../utils/helpers';
import Avatar from '../shared/Avatar';

export default function GroupDetailsDrawer({ conversation, currentUserId, onClose }) {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!conversation) return null;

  const participants = conversation.participants || [];
  const filteredParticipants = participants.filter(p => {
    const name = p.user?.fullName?.toLowerCase() || '';
    const username = p.user?.username?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || username.includes(q);
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
                  const isYou = p.userId === currentUserId;

                  return (
                    <div key={p.id || p.userId} className="participant-item">
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
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
