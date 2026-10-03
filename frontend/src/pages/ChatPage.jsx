import { useState, useEffect, useCallback } from 'react';
import Sidebar from '../components/sidebar/Sidebar';
import ChatWindow from '../components/chat/ChatWindow';
import useChatStore from '../store/chatStore';

export default function ChatPage() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const { activeConversationId } = useChatStore();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Detectar cambio de tamaño
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // En mobile: mostrar sidebar cuando no hay conversación activa
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(!activeConversationId);
    }
  }, [activeConversationId, isMobile]);

  const handleCloseSidebar = useCallback(() => {
    if (isMobile) setSidebarOpen(false);
  }, [isMobile]);

  const handleOpenSidebar = useCallback(() => {
    setSidebarOpen(true);
  }, []);

  return (
    <>
      {/* Overlay para cerrar sidebar en mobile */}
      {isMobile && sidebarOpen && activeConversationId && (
        <div 
          className="sidebar-overlay"
          onClick={handleCloseSidebar}
        />
      )}
      
      <div className="app-layout">
        <Sidebar 
          isMobileOpen={sidebarOpen}
          onClose={handleCloseSidebar}
        />
        <ChatWindow onOpenSidebar={handleOpenSidebar} />
      </div>
    </>
  );
}
