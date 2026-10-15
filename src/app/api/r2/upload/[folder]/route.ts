import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { adminId } from '@/lib/auth';
import { db } from '@/lib/db';
import { imageTypes, maxImageSize, r2, r2Bucket, validImageKey } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ folder: string }> }) {
  const { folder } = await context.params;
  if (folder !== 'products' && folder !== 'slips' && folder !== 'banners') return new Response('Not found', { status: 404 });
  try {
    const body = await request.json() as { key?: unknown; contentType?: unknown; size?: unknown; orderCode?: unknown };
    if (typeof body.key !== 'string' || !validImageKey(body.key, folder) || !imageTypes.includes(String(body.contentType)) ||
      typeof body.size !== 'number' || !Number.isInteger(body.size) || body.size < 1 || body.size > maxImageSize) {
      return Response.json({ error: 'Invalid image' }, { status: 400 });
    }
    if (folder === 'products' || folder === 'banners') {
      if (!await adminId()) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    } else {
      if (typeof body.orderCode !== 'string' || !/^[a-f0-9]{32}$/.test(body.orderCode)) return Response.json({ error: 'Invalid order' }, { status: 400 });
      const order = await db().order.findUnique({ where: { code: body.orderCode }, select: { status: true } });
      if (!order || !['AWAITING_SLIP', 'REJECTED'].includes(order.status)) return Response.json({ error: 'Order cannot accept a slip' }, { status: 409 });
    }
    const url = await getSignedUrl(r2(), new PutObjectCommand({
      Bucket: r2Bucket(), Key: body.key, ContentType: body.contentType as string,
    }), { expiresIn: 300 });
    return Response.json({ url, key: body.key });
  } catch (error) {
    console.error('[r2-upload]', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Upload unavailable' }, { status: 503 });
  }
}
