import { useState, useEffect } from 'react';
import api from '../../services/api';
import useChatStore from '../../store/chatStore';
import { getRoleLabel } from '../../utils/helpers';
import Avatar from '../shared/Avatar';

export default function NewDirectChatModal({ onClose }) {
  const { openDirectChat } = useChatStore();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.data)).catch(console.error);
  }, []);

  const handleSelectUser = async (userId) => {
    setIsLoading(true);
    setError('');
    try {
      await openDirectChat(userId);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'No puedes iniciar un chat con este usuario');
    }
    setIsLoading(false);
  };

  const filtered = users.filter(u =>
    u.fullName.toLowerCase().includes(search.toLowerCase()) ||
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const grouped = filtered.reduce((acc, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role].push(u);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Nuevo Chat</h2>
          <button id="close-new-direct" className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="search-bar" style={{ marginBottom: 12 }}>
          <div className="search-bar-icon">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </div>
          <input
            id="user-search-input"
            type="search"
            placeholder="Buscar usuario..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            autoFocus
          />
        </div>

        {error && <div className="error-message" style={{ marginBottom: 8 }}>⚠️ {error}</div>}

        <div style={{ 
          maxHeight: 360, 
          overflowY: 'auto',
          background: 'var(--color-bg-tertiary)',
          border: '1px solid var(--color-border)',
          borderRadius: 8,
        }}>
          {Object.entries(grouped).map(([role, roleUsers]) => (
            <div key={role}>
              <div style={{ 
                padding: '8px 12px', 
                fontSize: 10, fontWeight: 700,
                letterSpacing: 1, textTransform: 'uppercase',
                color: 'var(--color-text-muted)',
                background: 'var(--color-bg-secondary)',
                borderBottom: '1px solid var(--color-border)',
                position: 'sticky', top: 0,
              }}>
                {getRoleLabel(role)}
              </div>
              {roleUsers.map(u => (
                <div
                  key={u.id}
                  id={`user-item-${u.id}`}
                  onClick={() => !isLoading && handleSelectUser(u.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px',
                    cursor: isLoading ? 'wait' : 'pointer',
                    borderBottom: '1px solid var(--color-border)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Avatar user={u} showOnline isOnline={u.isOnline} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{u.fullName}</div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>@{u.username}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                    <span className={`role-badge ${u.role}`}>{getRoleLabel(u.role)}</span>
                    <div style={{ 
                      width: 8, height: 8, borderRadius: '50%',
                      background: u.isOnline ? 'var(--color-online)' : 'var(--color-offline)'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: 24, textAlign: 'center', color: 'var(--color-text-muted)', fontSize: 13 }}>
              No se encontraron usuarios
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
