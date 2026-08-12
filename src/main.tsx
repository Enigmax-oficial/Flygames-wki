import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';

const CLIENT_ID = '309962205395-c36qhp6n9qold6kcd5ii3d4t3q04qvt9.apps.googleusercontent.com';

// Prevent benign WebSocket/Vite/HMR error overlays from interrupting the app preview
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const msg = reason?.message || String(reason || '');
    if (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('HMR') || 
      msg.includes('vite')
    ) {
      event.preventDefault();
      console.warn('⚡ Suppressed benign development WebSocket rejection:', reason);
    }
  });

  window.addEventListener('error', (event) => {
    const msg = event.message || '';
    if (
      msg.includes('WebSocket') || 
      msg.includes('websocket') || 
      msg.includes('HMR') || 
      msg.includes('vite')
    ) {
      event.preventDefault();
      console.warn('⚡ Suppressed benign development WebSocket error:', msg);
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);
