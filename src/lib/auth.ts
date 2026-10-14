import 'server-only';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { redirect } from 'next/navigation';

const cookieName = 'mini_ecom_admin';

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error('SESSION_SECRET must be at least 32 characters');
  return new TextEncoder().encode(secret);
}

export async function signIn(adminId: string) {
  const token = await new SignJWT({ role: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(key());
  (await cookies()).set(cookieName, token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    path: '/', maxAge: 60 * 60 * 24 * 7,
  });
}

export async function adminId() {
  const token = (await cookies()).get(cookieName)?.value;
  if (!token) return null;
  try {
    const result = await jwtVerify(token, key());
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
