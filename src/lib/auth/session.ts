import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export const SESSION_COOKIE_NAME = 'recruitos_session';
const DEFAULT_SECRET = 'recruitos_enterprise_jwt_super_secret_key_2026_x88';

function getJwtSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET || DEFAULT_SECRET;
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  role: string;
  agencyId: string;
}

/**
 * Creates an encrypted JWT session token valid for 7 days.
 */
export async function createSessionToken(payload: SessionPayload): Promise<string> {
  const secret = getJwtSecret();
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(secret);
}

/**
 * Verifies a JWT session token and returns the payload if valid.
 */
export async function verifySessionToken(token: string): Promise<SessionPayload | null> {
  if (!token) return null;
  try {
    const secret = getJwtSecret();
    const { payload } = await jwtVerify(token, secret);
    return {
      userId: String(payload.userId),
      email: String(payload.email),
      role: String(payload.role),
      agencyId: String(payload.agencyId || '')
    };
  } catch (error) {
    return null;
  }
}

/**
 * Sets the HTTP-only session cookie in the client browser.
 */
export async function setSessionCookie(payload: SessionPayload): Promise<void> {
  const token = await createSessionToken(payload);
  const cookieStore = cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 // 7 days
  });
}

/**
 * Reads and verifies the current session cookie from the request.
 */
export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = cookies();
    const cookie = cookieStore.get(SESSION_COOKIE_NAME);
    if (!cookie || !cookie.value) return null;
    return await verifySessionToken(cookie.value);
  } catch (e) {
    return null;
  }
}

/**
 * Destroys the current session cookie.
 */
export async function clearSession(): Promise<void> {
  try {
    const cookieStore = cookies();
    cookieStore.set(SESSION_COOKIE_NAME, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0
    });
  } catch (e) {
    // Ignore if called outside server context
  }
}
