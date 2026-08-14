require('dotenv').config();
const { execSync } = require('child_process');

async function patch() {
  try {
    console.log('Adding avatar_url to users table...');
    const token = process.env.CLOUDFLARE_API_TOKEN || process.env.D1_TOKEN;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const databaseId = 'd7f3eefe-63ff-4b62-8baf-6dc44381abab';
    
    if (!token || !accountId || !databaseId) {
      console.log('Missing credentials');
      return;
    }
    
    const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/d1/database/${databaseId}/query`;
    
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sql: 'ALTER TABLE users ADD COLUMN avatar_url TEXT;' }),
    });
    
    const text = await res.text();
    console.log(text);
  } catch (e) {
    console.error(e);
  }
}
patch();
