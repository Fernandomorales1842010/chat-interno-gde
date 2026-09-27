import { useState, useEffect } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useChatStore from '../store/chatStore';

export default function ChatPage() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { activeConversationId } = useChatStore();

  // En mobile, mostrar sidebar cuando no hay conversación activa
  useEffect(() => {
    const checkMobile = () => {
      if (window.innerWidth <= 768 && !activeConversationId) {
        setIsMobileOpen(true);
      }
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [activeConversationId]);

  // Mostrar botón hamburguesa en mobile
  useEffect(() => {
    const btn = document.getElementById('mobile-back-btn');
    if (btn) {
      btn.style.display = window.innerWidth <= 768 ? 'flex' : 'none';
      btn.onclick = () => setIsMobileOpen(true);
    }
  }, [activeConversationId]);

  return (
    <>
      {/* Overlay para cerrar sidebar en mobile */}
      {isMobileOpen && (
        <div 
          style={{ 
            position: 'fixed', inset: 0, 
            background: 'rgba(0,0,0,0.5)', 
            zIndex: 99 
          }}
          onClick={() => setIsMobileOpen(false)}
        />
      )}
      
      <div className="app-layout">
        <Sidebar 
          isMobileOpen={isMobileOpen}
          onClose={() => setIsMobileOpen(false)}
        />
        <ChatWindow />
      </div>
    </>
  );
}
