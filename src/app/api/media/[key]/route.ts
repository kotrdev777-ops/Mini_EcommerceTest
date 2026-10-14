import { adminId } from '@/lib/auth';
import { getImage } from '@/lib/storage';
import { db } from '@/lib/db';

export const runtime = 'nodejs';

export async function GET(_: Request, context: { params: Promise<{ key: string }> }) {
  const { key: encoded } = await context.params;
  const key = decodeURIComponent(encoded);
  if (!/^(products|slips)\/[a-f0-9-]{36}\.(jpg|png|webp)$/.test(key)) return new Response('Not found', { status: 404 });
  if (key.startsWith('slips/')) {
    if (!await adminId()) return new Response('Unauthorized', { status: 401 });
    if (!await db().order.findFirst({ where: { slipKey: key }, select: { id: true } })) return new Response('Not found', { status: 404 });
  } else {
    if (!await db().product.findFirst({ where: { imageKey: key }, select: { id: true } })) return new Response('Not found', { status: 404 });
  }
  try {
    const object = await getImage(key);
    if (!object.Body) return new Response('Not found', { status: 404 });
    const bytes = await object.Body.transformToByteArray();
    return new Response(new Uint8Array(bytes).buffer as ArrayBuffer, {
      headers: {
        'Content-Type': object.ContentType || 'application/octet-stream',
        'Cache-Control': key.startsWith('products/') ? 'public, max-age=3600' : 'private, no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch { return new Response('Not found', { status: 404 }); }
}
