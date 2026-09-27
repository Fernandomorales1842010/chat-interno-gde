import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import useSocket from './hooks/useSocket';
import LoginPage from './pages/LoginPage';
import ChatPage from './pages/ChatPage';
import AdminPage from './pages/AdminPage';

function ProtectedRoute({ children }) {
  const { user, token } = useAuthStore();
  if (!token) return <Navigate to="/login" replace />;
  return children;
}

function AppRoutes() {
  const { user, token, fetchMe } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);
  
  // Inicializar socket (solo cuando hay usuario)
  useSocket();

  useEffect(() => {
    if (token && !user) {
      fetchMe().finally(() => setIsInitializing(false));
    } else {
      setIsInitializing(false);
    }
  }, []);

  if (isInitializing) {
    return (
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: 'var(--color-bg-primary)'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🏭</div>
          <div className="spinner" style={{ margin: '0 auto' }} />
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route 
        path="/login" 
        element={token && user ? <Navigate to="/" replace /> : <LoginPage />} 
      />
      <Route 
        path="/" 
        element={
          <ProtectedRoute>
            <ChatPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/admin" 
        element={
          <ProtectedRoute>
            <AdminPage />
          </ProtectedRoute>
        } 
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}
