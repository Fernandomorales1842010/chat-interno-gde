import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Registrar Service Worker para PWA y modo nativo en Handhelds Zebra TC22
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((reg) => {
        console.log('[PWA] Service Worker registrado exitosamente con scope:', reg.scope);
      })
      .catch((err) => {
        console.error('[PWA] Error registrando Service Worker:', err);
      });
  });
}
