import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Verifies a plaintext password against a stored bcrypt hash.
 * Supports fallback checks forlegacy $sha256$ format if any exist.
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  if (!password || !hash) return false;

  // Support standard bcrypt hashes ($2a$, $2b$, $2y$)
  if (hash.startsWith('$2a$') || hash.startsWith('$2b$') || hash.startsWith('$2y$')) {
    return bcrypt.compare(password, hash);
  }

  // Fallback for legacy sha256 hashes generated during temporary scripts
  if (hash.startsWith('$sha256$')) {
    const crypto = require('crypto');
    const legacyHash = `$sha256$${crypto.createHash('sha256').update(password).digest('hex')}`;
    return legacyHash === hash;
  }

  return bcrypt.compare(password, hash);
}
