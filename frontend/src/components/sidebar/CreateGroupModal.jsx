import { useState, useEffect } from 'react';
import api from '../../services/api';
import useChatStore from '../../store/chatStore';
import useAuthStore from '../../store/authStore';
import { getRoleLabel } from '../../utils/helpers';
import Avatar from '../shared/Avatar';

export default function CreateGroupModal({ onClose }) {
  const { user } = useAuthStore();
  const { createGroup } = useChatStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/users').then(res => setUsers(res.data.data)).catch(console.error);
  }, []);

  const toggleUser = (userId) => {
    setSelectedIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const handleCreate = async () => {
    if (!name.trim()) { setError('El nombre es requerido'); return; }
    if (selectedIds.length === 0) { setError('Selecciona al menos un participante'); return; }
    
    setIsLoading(true);
    try {
      await createGroup({ name, description, participantIds: selectedIds });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Error al crear el grupo');
    }
    setIsLoading(false);
  };

  // Agrupar usuarios por rol
  const grouped = users.reduce((acc, u) => {
    if (!acc[u.role]) acc[u.role] = [];
    acc[u.role].push(u);
    return acc;
  }, {});

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Crear Grupo</h2>
          <button id="close-create-group" className="icon-btn" onClick={onClose}>✕</button>
        </div>

        <div className="form-group">
          <label className="form-label">Nombre del grupo *</label>
          <input
            id="group-name-input"
            type="text"
            className="form-input"
            placeholder="Ej: Equipo Turno Noche"
            value={name}
            onChange={e => setName(e.target.value)}
            maxLength={50}
          />
        </div>

        <div className="form-group">
          <label className="form-label">Descripción (opcional)</label>
          <input
            id="group-desc-input"
            type="text"
            className="form-input"
            placeholder="Para qué es este grupo..."
            value={description}
            onChange={e => setDescription(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label className="form-label">
            Participantes ({selectedIds.length} seleccionados)
          </label>
          <div style={{ 
            maxHeight: 280, 
            overflowY: 'auto', 
            background: 'var(--color-bg-tertiary)',
            border: '1px solid var(--color-border)',
            borderRadius: 8,
          }}>
            {Object.entries(grouped).map(([role, roleUsers]) => (
              <div key={role}>
                <div style={{ 
                  padding: '8px 12px', 
                  fontSize: 10, 
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  color: 'var(--color-text-muted)',
                  background: 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-border)'
                }}>
                  {getRoleLabel(role)}
                </div>
                {roleUsers.map(u => (
                  <div
                    key={u.id}
                    onClick={() => toggleUser(u.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '10px 12px',
                      cursor: 'pointer',
                      background: selectedIds.includes(u.id) ? 'var(--color-accent-light)' : 'transparent',
                      borderBottom: '1px solid var(--color-border)',
                      transition: 'background 0.15s',
                    }}
                  >
                    <Avatar user={u} size="sm" showOnline isOnline={u.isOnline} />
                    <span style={{ fontSize: 13.5, flex: 1 }}>{u.fullName}</span>
                    <div style={{
                      width: 18, height: 18, borderRadius: 4,
                      border: '2px solid',
                      borderColor: selectedIds.includes(u.id) ? 'var(--color-accent)' : 'var(--color-border)',
                      background: selectedIds.includes(u.id) ? 'var(--color-accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, color: 'white', transition: 'all 0.15s',
                      flexShrink: 0,
                    }}>
                      {selectedIds.includes(u.id) && '✓'}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {error && <div className="error-message">⚠️ {error}</div>}

        <button
          id="confirm-create-group"
          className="btn btn-primary"
          onClick={handleCreate}
          disabled={isLoading}
          style={{ marginTop: 16 }}
        >
          {isLoading ? <><div className="spinner" /> Creando...</> : '✓ Crear Grupo'}
        </button>
      </div>
    </div>
  );
}
