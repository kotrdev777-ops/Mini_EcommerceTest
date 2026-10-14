import { adminId } from '@/lib/auth';
import { blobToken, validImageKey } from '@/lib/storage';
import { get, head } from '@vercel/blob';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_: Request, context: { params: Promise<{ key: string }> }) {
  const { key: encoded } = await context.params;
  const key = decodeURIComponent(encoded);
  if (!validImageKey(key, 'products') && !validImageKey(key, 'slips')) return new Response('Not found', { status: 404 });
  if (key.startsWith('slips/')) {
    if (!await adminId()) return new Response('Unauthorized', { status: 401 });
    if (!await db().order.findFirst({ where: { slipKey: key }, select: { id: true } })) return new Response('Not found', { status: 404 });
  } else {
    if (!await db().product.findFirst({ where: { imageKey: key }, select: { id: true } })) return new Response('Not found', { status: 404 });
  }
  try {
    if (key.startsWith('products/')) {
      const object = await head(key, { token: blobToken('products') });
      return Response.redirect(object.url, 307);
    }
    const object = await get(key, { access: 'private', token: blobToken('slips') });
    if (!object || object.statusCode !== 200) return new Response('Not found', { status: 404 });
    return new Response(object.stream, {
      headers: {
        'Content-Type': object.blob.contentType,
        'Cache-Control': key.startsWith('products/') ? 'public, max-age=3600' : 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch { return new Response('Not found', { status: 404 }); }
}
