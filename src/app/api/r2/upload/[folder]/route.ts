import { PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { adminId } from '@/lib/auth';
import { db } from '@/lib/db';
import { imageTypes, maxImageSize, r2, r2Bucket, validImageKey } from '@/lib/storage';

export const runtime = 'nodejs';

type Folder = 'products' | 'slips' | 'banners';
type UploadRequest = { key: unknown; contentType: unknown; size: unknown; orderCode: unknown };

async function authorize(folder: string, body: UploadRequest): Promise<Response | { folder: Folder; key: string; contentType: string }> {
  if (folder !== 'products' && folder !== 'slips' && folder !== 'banners') return new Response('Not found', { status: 404 });
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
  return { folder, key: body.key, contentType: String(body.contentType) };
}

export async function POST(request: Request, context: { params: Promise<{ folder: string }> }) {
  const { folder } = await context.params;
  try {
    const body = await request.json() as UploadRequest;
    const auth = await authorize(folder, body);
    if (auth instanceof Response) return auth;
    const url = await getSignedUrl(r2(), new PutObjectCommand({
      Bucket: r2Bucket(), Key: auth.key, ContentType: auth.contentType,
    }), { expiresIn: 300 });
    return Response.json({ url, key: auth.key });
  } catch (error) {
    console.error('[r2-upload] presign', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Upload unavailable' }, { status: 503 });
  }
}

export async function PUT(request: Request, context: { params: Promise<{ folder: string }> }) {
  const { folder } = await context.params;
  try {
    const bytes = Buffer.from(await request.arrayBuffer());
    const auth = await authorize(folder, {
      key: request.headers.get('x-image-key'),
      contentType: request.headers.get('content-type'),
      size: bytes.length,
      orderCode: request.headers.get('x-order-code') ?? undefined,
    });
    if (auth instanceof Response) return auth;
    await r2().send(new PutObjectCommand({ Bucket: r2Bucket(), Key: auth.key, ContentType: auth.contentType, Body: bytes }));
    return Response.json({ key: auth.key });
  } catch (error) {
    console.error('[r2-upload] server upload', error instanceof Error ? error.message : error);
    return Response.json({ error: 'Upload unavailable' }, { status: 503 });
  }
}
