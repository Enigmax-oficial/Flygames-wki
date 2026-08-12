import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { query } from './db/client.ts';
import { runDatabaseHealthCheck } from './db/health.ts';

const CLIENT_ID = '309962205395-c36qhp6n9qold6kcd5ii3d4t3q04qvt9.apps.googleusercontent.com';

// Runtime self-check on app startup
(async () => {
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

  console.log('🔍 Starting SQLite HTTP Range Request database runtime self-check...');
  try {
    const result = await runDatabaseHealthCheck(query);
    console.log('🔍 [Self-Check Trace] PRAGMA integrity_check raw result:', JSON.stringify(result.trace.integrity));
    console.log('🔍 [Self-Check Trace] sqlite_master check raw result:', JSON.stringify(result.trace.schema));
    console.log('🔍 [Self-Check Trace] COUNT(*) check raw result:', JSON.stringify(result.trace.count));
    console.log(`🔍 [Self-Check Results] Integrity: ${result.integrityOk ? 'PASS' : 'FAIL'}, Schema: ${result.schemaOk ? 'PASS' : 'FAIL'}, Row Count: ${result.countOk ? 'PASS' : 'FAIL'}`);

    if (result.success) {
      console.log('✅ DATABASE SELF-CHECK SUCCESS: All checks (integrity, schema, and row count) passed!');
    } else {
      console.error('❌ DATABASE SELF-CHECK FAILED: Database integrity check, schema check, or row count validation failed!');
    }
  } catch (err) {
    console.error('❌ DATABASE SELF-CHECK ERROR: Failed to run SQLite range-request query on startup:', err);
  }
})();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <App />
    </GoogleOAuthProvider>
  </StrictMode>,
);



