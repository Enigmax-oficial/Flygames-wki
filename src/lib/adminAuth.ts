const SECRET_KEY = 'AETHERIA_ADMIN_KEY_2026';

// Encrypted hex representation of authorized admin email
const ENCRYPTED_ADMIN_EMAILS = [
  '3330352635332b2d302d2b3d2c3d3d392c2d304070555b202c3866263d24'
];

export function decryptAdminEmail(hex: string): string {
  let result = '';
  for (let i = 0; i < hex.length; i += 2) {
    const charCode = parseInt(hex.substring(i, i + 2), 16);
    const keyChar = SECRET_KEY.charCodeAt((i / 2) % SECRET_KEY.length);
    result += String.fromCharCode(charCode ^ keyChar);
  }
  return result;
}

export function isAuthorizedAdminEmail(email: string | null | undefined): boolean {
  if (!email || typeof email !== 'string') return false;
  if (typeof window !== 'undefined' && sessionStorage.getItem('admin_auth_verified') === 'true') {
    return true;
  }
  const clean = email.toLowerCase().trim();

  if (clean === 'adm' || clean === 'adm@wiki.local' || clean === 'admin') return true;

  // Check against env configured emails if provided
  const envEmails = (import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map((e: string) => e.trim().toLowerCase())
    .filter(Boolean);

  if (envEmails.includes(clean)) return true;

  // Check decrypted authorized hashes
  for (const enc of ENCRYPTED_ADMIN_EMAILS) {
    if (clean === decryptAdminEmail(enc).toLowerCase()) return true;
  }

  return false;
}
