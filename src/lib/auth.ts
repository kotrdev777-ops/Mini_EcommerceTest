import 'server-only';
import { cookies } from 'next/headers';
import { randomBytes } from 'node:crypto';
import { db } from '@/lib/db';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const cookieName = 'mini_ecom_admin';

async function key() {
  const configured = process.env.SESSION_SECRET;
  if (configured) return new TextEncoder().encode(configured);

  const database = db();
  let store = await database.store.findUnique({ where: { id: 1 }, select: { sessionKey: true } });
  if (!store) throw new Error('Store must be set up before signing in');
  if (!store.sessionKey) {
    const generated = randomBytes(32).toString('base64url');
    await database.store.updateMany({ where: { id: 1, sessionKey: null }, data: { sessionKey: generated } });
    store = await database.store.findUniqueOrThrow({ where: { id: 1 }, select: { sessionKey: true } });
  }
  if (!store.sessionKey) throw new Error('Session key is unavailable');
  return Buffer.from(store.sessionKey, 'base64url');
}

export async function signIn(adminId: string) {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(await key());
  (await cookies()).set(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 * 7,
  });
}

export async function adminId() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const result = await jwtVerify(token, await key());
    return result.payload.role === 'admin' && result.payload.sub ? result.payload.sub : null;
  } catch { return null; }
}

export async function requireAdmin() {
  const id = await adminId();
  if (!id) redirect('/admin/login');
  return id;
}

export async function signOut() {
  (await cookies()).delete(cookieName);
}
