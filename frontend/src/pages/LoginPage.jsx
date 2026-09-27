import { useState } from 'react';
import useAuthStore from '../store/authStore';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, isLoading, error, clearError } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();
    await login(username, password);
  };

  return (
    <div className="login-page">
      <div className="login-bg-gradient" />
      
      <div className="login-card">
        <div className="login-logo">
          <div className="login-logo-icon">🏭</div>
          <div>
            <div className="login-title">Chat GDE</div>
            <div className="login-subtitle">Centro de Distribución</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Usuario</label>
            <input
              id="username"
              type="text"
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="tu.usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              autoCapitalize="none"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Contraseña</label>
            <input
              id="password"
              type="password"
              className={`form-input ${error ? 'error' : ''}`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            id="login-submit-btn"
            type="submit"
            className="btn btn-primary"
            style={{ marginTop: 24 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div className="spinner" />
                Ingresando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>

        <div style={{ 
          marginTop: 24, 
          padding: '12px 16px',
          background: 'var(--color-bg-tertiary)',
          borderRadius: 8,
          border: '1px solid var(--color-border)'
        }}>
          <p style={{ fontSize: 11, color: 'var(--color-text-muted)', textAlign: 'center' }}>
            Sistema de uso exclusivo para personal autorizado del Centro de Distribución
          </p>
        </div>
      </div>
    </div>
  );
}
