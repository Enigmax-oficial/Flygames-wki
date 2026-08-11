import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { GoogleOAuthProvider } from '@react-oauth/google';
import App from './App.tsx';
import './index.css';
import { query } from './db/client.ts';

const CLIENT_ID = '309962205395-c36qhp6n9qold6kcd5ii3d4t3q04qvt9.apps.googleusercontent.com';

// Runtime self-check on app startup
(async () => {
  console.log('🔍 Starting SQLite HTTP Range Request database runtime self-check...');
  try {
    const results = await query<{ one: number }>('SELECT 1 as one;');
    if (results && results[0]?.one === 1) {
      console.log('✅ DATABASE SELF-CHECK SUCCESS: SQLite range query executed successfully!', results);
    } else {
      console.error('❌ DATABASE SELF-CHECK FAILURE: SQL executed but returned unexpected results:', results);
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



