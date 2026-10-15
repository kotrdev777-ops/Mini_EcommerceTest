import { adminId } from '@/lib/auth';
import { db } from '@/lib/db';
import { imageObject, validImageKey } from '@/lib/storage';

export const runtime = 'nodejs';

export async function GET(_: Request, context: { params: Promise<{ key: string }> }) {
  const { key } = await context.params;
  if (!validImageKey(key, 'products') && !validImageKey(key, 'slips')) return new Response('Not found', { status: 404 });
  if (key.startsWith('slips/')) {
    if (!await adminId()) return new Response('Unauthorized', { status: 401 });
    if (!await db().order.findFirst({ where: { slipKey: key }, select: { id: true } })) return new Response('Not found', { status: 404 });
  } else if (!await db().product.findFirst({ where: { imageKey: key }, select: { id: true } })) return new Response('Not found', { status: 404 });
  try {
    const object = await imageObject(key);
    return new Response(new Uint8Array(object.bytes), { headers: {
      'Content-Type': object.contentType,
      'Cache-Control': key.startsWith('products/') ? 'public, max-age=3600' : 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    } });
  } catch { return new Response('Not found', { status: 404 }); }
}
