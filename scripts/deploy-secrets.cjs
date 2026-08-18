const { execSync } = require('child_process');
const isWin = process.platform === 'win32';

const { JWT_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL } = process.env;

if (JWT_SECRET && RESEND_API_KEY && RESEND_FROM_EMAIL) {
  console.log('Secrets detected in environment. Updating Cloudflare Worker secrets...');
  try {
    if (isWin) {
      execSync('scripts\\set-secrets.bat', { stdio: 'inherit' });
    } else {
      execSync('bash scripts/set-secrets.sh', { stdio: 'inherit' });
    }
    console.log('Cloudflare Worker secrets successfully configured before deployment.');
  } catch (err) {
    console.error('Failed to configure Cloudflare Worker secrets:', err.message);
    process.exit(1);
  }
} else {
  console.log('Worker secret env vars (JWT_SECRET, RESEND_API_KEY, RESEND_FROM_EMAIL) not present in environment; skipping automated secret update.');
}
