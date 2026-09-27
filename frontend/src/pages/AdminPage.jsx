import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../services/api';
import Avatar from '../components/shared/Avatar';
import { getRoleLabel } from '../utils/helpers';

export default function AdminPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'teams'
  const [users, setUsers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Modales
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);

  // Form states
  const [userFormData, setUserFormData] = useState({
    username: '',
    fullName: '',
    password: '',
    role: 'BODEGUERO',
    teamId: ''
  });
  const [teamFormData, setTeamFormData] = useState({
    name: '',
    leaderId: '',
    memberIds: []
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const canManage = ['ADMIN', 'SUPERVISOR', 'IT'].includes(user?.role);

  useEffect(() => {
    if (!canManage) {
      navigate('/');
      return;
    }
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usersRes, teamsRes] = await Promise.all([
        api.get('/users?all=true'),
        api.get('/teams')
      ]);
      if (usersRes.data.success) setUsers(usersRes.data.data);
      if (teamsRes.data.success) setTeams(teamsRes.data.data);
    } catch (err) {
      console.error('Error cargando datos de admin:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateUser = () => {
    setUserFormData({
      username: '',
      fullName: '',
      password: '',
      role: 'BODEGUERO',
      teamId: ''
    });
    setEditingUser(null);
    setErrorMsg('');
    setShowCreateUser(true);
  };

  const handleOpenEditUser = (u) => {
    setEditingUser(u);
    setUserFormData({
      username: u.username,
      fullName: u.fullName,
      password: '',
      role: u.role,
      teamId: u.teamId || ''
    });
    setErrorMsg('');
    setShowCreateUser(true);
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (editingUser) {
        // Update user
        const payload = {
          fullName: userFormData.fullName,
          role: userFormData.role,
          teamId: userFormData.teamId || null
        };
        const res = await api.put(`/users/${editingUser.id}`, payload);
        if (res.data.success) {
          setSuccessMsg('Usuario actualizado correctamente');
          setShowCreateUser(false);
          loadData();
        }
      } else {
        // Create user
        if (!userFormData.username || !userFormData.fullName || !userFormData.password) {
          setErrorMsg('Por favor completa todos los campos requeridos');
          return;
        }
        const res = await api.post('/users', userFormData);
        if (res.data.success) {
          setSuccessMsg('Usuario creado exitosamente');
          setShowCreateUser(false);
          loadData();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar usuario');
    }
  };

  const handleDeleteUser = async (uId, username) => {
    if (!window.confirm(`¿Estás seguro de eliminar el usuario "${username}"?`)) return;
    try {
      const res = await api.delete(`/users/${uId}`);
      if (res.data.success) {
        setSuccessMsg('Usuario eliminado');
        loadData();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Error al eliminar usuario');
    }
  };

  const handleOpenCreateTeam = () => {
    setTeamFormData({ name: '', leaderId: '', memberIds: [] });
    setEditingTeam(null);
    setErrorMsg('');
    setShowCreateTeam(true);
  };

  const handleSaveTeam = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    try {
      if (!teamFormData.name || !teamFormData.leaderId) {
        setErrorMsg('El nombre y el líder del equipo son requeridos');
        return;
      }
      if (editingTeam) {
        const res = await api.put(`/teams/${editingTeam.id}`, teamFormData);
        if (res.data.success) {
          setSuccessMsg('Equipo actualizado');
          setShowCreateTeam(false);
          loadData();
        }
      } else {
        const res = await api.post('/teams', teamFormData);
        if (res.data.success) {
          setSuccessMsg('Equipo creado exitosamente');
          setShowCreateTeam(false);
          loadData();
        }
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Error al guardar equipo');
    }
  };

  // Filtrado de usuarios
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.fullName.toLowerCase().includes(search.toLowerCase()) || 
                          u.username.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  // Lista de líderes disponibles (para formulario de equipos)
  const availableLeaders = users.filter(u => u.role === 'TEAM_LEADER');
  // Lista de bodegueros disponibles
  const availableBodegueros = users.filter(u => u.role === 'BODEGUERO');

  return (
    <div className="admin-page-container">
      {/* Header Admin */}
      <div className="admin-header">
        <div className="admin-header-title">
          <div className="admin-brand-icon">⚙️</div>
          <div>
            <h1>Panel de Administración</h1>
            <p>Gestión de usuarios y equipos del Centro de Distribución GDE</p>
          </div>
        </div>
        <button className="btn-secondary" onClick={() => navigate('/')}>
          ← Volver al Chat
        </button>
      </div>

      {/* Banner Notificaciones */}
      {successMsg && (
        <div className="admin-alert success" onClick={() => setSuccessMsg('')}>
          ✅ {successMsg}
        </div>
      )}

      {/* Subheader & Tabs */}
      <div className="admin-nav-bar">
        <div className="admin-tabs">
          <button 
            className={`admin-tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👤 Usuarios ({users.length})
          </button>
          <button 
            className={`admin-tab-btn ${activeTab === 'teams' ? 'active' : ''}`}
            onClick={() => setActiveTab('teams')}
          >
            📦 Equipos ({teams.length})
          </button>
        </div>

        {activeTab === 'users' ? (
          <button className="btn-primary" onClick={handleOpenCreateUser}>
            + Nuevo Usuario
          </button>
        ) : (
          <button className="btn-primary" onClick={handleOpenCreateTeam}>
            + Nuevo Equipo
          </button>
        )}
      </div>

      {/* Vista de Usuarios */}
      {activeTab === 'users' && (
        <div className="admin-content-section">
          {/* Filtros */}
          <div className="admin-filters">
            <input 
              type="text" 
              className="admin-search-input"
              placeholder="Buscar por nombre o usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select 
              className="admin-select-filter"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="">Todos los roles</option>
              <option value="BODEGUERO">Bodeguero</option>
              <option value="TEAM_LEADER">Líder de Equipo</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="IT">Soporte IT</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          {/* Tabla de Usuarios */}
          {loading ? (
            <div className="admin-loading">Cargando usuarios...</div>
          ) : (
            <div className="admin-table-container">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Rol</th>
                    <th>Equipo</th>
                    <th>Estado</th>
                    <th style={{ textAlign: 'right' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                        No se encontraron usuarios
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map(u => (
                      <tr key={u.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Avatar user={u} showOnline isOnline={u.isOnline} />
                            <div>
                              <div style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>{u.fullName}</div>
                              <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>@{u.username}</div>
                            </div>
                          </div>
                        </td>
                        <td>
                          <span className={`role-badge ${u.role}`}>
                            {getRoleLabel(u.role)}
                          </span>
                        </td>
                        <td>
                          {u.team ? (
                            <span className="team-pill">📦 {u.team.name}</span>
                          ) : (
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 13 }}>Sin equipo</span>
                          )}
                        </td>
                        <td>
                          {u.isOnline ? (
                            <span className="status-indicator online">🟢 En línea</span>
                          ) : (
                            <span className="status-indicator offline">⚪ Desconectado</span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            className="btn-action edit" 
                            onClick={() => handleOpenEditUser(u)}
                            title="Editar usuario"
                          >
                            ✏️ Editar
                          </button>
                          {user?.role === 'ADMIN' && (
                            <button 
                              className="btn-action delete" 
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              title="Eliminar usuario"
                              style={{ marginLeft: 6 }}
                            >
                              🗑️
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Vista de Equipos */}
      {activeTab === 'teams' && (
        <div className="admin-content-section">
          {loading ? (
            <div className="admin-loading">Cargando equipos...</div>
          ) : (
            <div className="teams-grid">
              {teams.length === 0 ? (
                <div style={{ color: 'var(--color-text-muted)', gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>
                  No hay equipos registrados. ¡Crea el primero!
                </div>
              ) : (
                teams.map(team => (
                  <div key={team.id} className="team-card">
                    <div className="team-card-header">
                      <div className="team-card-title">📦 {team.name}</div>
                      <button className="btn-action edit" onClick={() => {
                        setEditingTeam(team);
                        setTeamFormData({ name: team.name, leaderId: team.leaderId, memberIds: team.members.map(m => m.id) });
                        setShowCreateTeam(true);
                      }}>
                        ✏️ Editar
                      </button>
                    </div>

                    <div className="team-card-leader">
                      <span className="section-subtitle">Líder asignado:</span>
                      {team.leader ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Avatar user={team.leader} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{team.leader.fullName}</div>
                            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)' }}>@{team.leader.username}</div>
                          </div>
                        </div>
                      ) : (
                        <div style={{ color: 'var(--color-danger)', fontSize: 13 }}>Sin líder asignado</div>
                      )}
                    </div>

                    <div className="team-card-members">
                      <span className="section-subtitle">Integrantes ({team.members?.length || 0}):</span>
                      <div className="members-avatars-list">
                        {team.members?.length === 0 ? (
                          <div style={{ fontSize: 12, color: 'var(--color-text-muted)' }}>Sin miembros en este equipo</div>
                        ) : (
                          team.members?.map(m => (
                            <div key={m.id} className="member-item-chip" title={m.fullName}>
                              <Avatar user={m} />
                              <span>{m.fullName.split(' ')[0]}</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Modal Crear / Editar Usuario */}
      {showCreateUser && (
        <div className="modal-overlay" onClick={() => setShowCreateUser(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingUser ? '✏️ Editar Usuario' : '👤 Crear Nuevo Usuario'}</h2>
              <button className="icon-btn" onClick={() => setShowCreateUser(false)}>✕</button>
            </div>

            {errorMsg && <div className="modal-error">⚠️ {errorMsg}</div>}

            <form onSubmit={handleSaveUser} className="modal-form">
              <div className="form-group">
                <label>Nombre completo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Juan Pérez"
                  value={userFormData.fullName}
                  onChange={e => setUserFormData({ ...userFormData, fullName: e.target.value })}
                />
              </div>

              {!editingUser && (
                <>
                  <div className="form-group">
                    <label>Nombre de usuario</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ej. juan.perez"
                      value={userFormData.username}
                      onChange={e => setUserFormData({ ...userFormData, username: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label>Contraseña inicial</label>
                    <input 
                      type="password" 
                      required
                      placeholder="••••••••"
                      value={userFormData.password}
                      onChange={e => setUserFormData({ ...userFormData, password: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div className="form-group">
                <label>Rol en el Centro de Distribución</label>
                <select 
                  value={userFormData.role}
                  onChange={e => setUserFormData({ ...userFormData, role: e.target.value })}
                >
                  <option value="BODEGUERO">Bodeguero (Handheld TC22)</option>
                  <option value="TEAM_LEADER">Líder de Equipo (Laptop/Móvil)</option>
                  <option value="SUPERVISOR">Supervisor (Laptop/Móvil)</option>
                  <option value="IT">Soporte IT</option>
                  <option value="ADMIN">Administrador General</option>
                </select>
              </div>

              <div className="form-group">
                <label>Equipo Asignado</label>
                <select 
                  value={userFormData.teamId}
                  onChange={e => setUserFormData({ ...userFormData, teamId: e.target.value })}
                >
                  <option value="">Sin equipo asignado</option>
                  {teams.map(t => (
                    <option key={t.id} value={t.id}>
                      📦 {t.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateUser(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Crear / Editar Equipo */}
      {showCreateTeam && (
        <div className="modal-overlay" onClick={() => setShowCreateTeam(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingTeam ? '✏️ Editar Equipo' : '📦 Crear Nuevo Equipo'}</h2>
              <button className="icon-btn" onClick={() => setShowCreateTeam(false)}>✕</button>
            </div>

            {errorMsg && <div className="modal-error">⚠️ {errorMsg}</div>}

            <form onSubmit={handleSaveTeam} className="modal-form">
              <div className="form-group">
                <label>Nombre del equipo</label>
                <input 
                  type="text" 
                  required
                  placeholder="Ej. Equipo D - Devoluciones"
                  value={teamFormData.name}
                  onChange={e => setTeamFormData({ ...teamFormData, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Líder del equipo</label>
                <select 
                  required
                  value={teamFormData.leaderId}
                  onChange={e => setTeamFormData({ ...teamFormData, leaderId: e.target.value })}
                >
                  <option value="">Selecciona un Líder de Equipo...</option>
                  {availableLeaders.map(l => (
                    <option key={l.id} value={l.id}>
                      🎯 {l.fullName} (@{l.username})
                    </option>
                  ))}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateTeam(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn-primary">
                  {editingTeam ? 'Guardar Cambios' : 'Crear Equipo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
