import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-me';
const TOKEN_EXPIRY = '7d';

export interface TokenPayload {
  email: string;
  name?: string;
  iat?: number;
  exp?: number;
}

// Create a JWT token
export function createToken(payload: { email: string; name?: string }): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
}

// Verify and decode a JWT token
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

// Get current user from cookies (server-side)
export async function getCurrentUser(): Promise<TokenPayload | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;
  
  if (!token) return null;
  return verifyToken(token);
}

// Create magic link token (shorter expiry)
export function createMagicLinkToken(email: string): string {
  return jwt.sign({ email, type: 'magic_link' }, JWT_SECRET, { expiresIn: '15m' });
}

// Verify magic link token
export function verifyMagicLinkToken(token: string): { email: string } | null {
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { email: string; type: string };
    if (payload.type !== 'magic_link') return null;
    return { email: payload.email };
  } catch {
    return null;
  }
}
