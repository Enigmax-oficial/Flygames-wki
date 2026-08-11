const SECRET_KEY = 'AETHERIA_ADMIN_KEY_2026';

// Encrypted hex representation of authorized admin email
const ENCRYPTED_ADMIN_EMAILS = [
  '3330352635332b2d302d2b3d2c3d3d392c2d304070555b202c3866263d24' // ruanpablolopesbritor@gmail.com
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
  if (!email) return false;
  const normalized = email.toLowerCase().trim();
  return normalized === 'ruanpablolopesbritor@gmail.com' || normalized === 'ruanpablolopesbritoruan@gmail.com';
}
