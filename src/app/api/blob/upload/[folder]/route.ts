import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { adminId } from '@/lib/auth';
import { db } from '@/lib/db';
import { blobToken, imageTypes, maxImageSize } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ folder: string }> }) {
  try {
    const { folder } = await context.params;
    if (folder !== 'products' && folder !== 'slips') return new Response('Not found', { status: 404 });
    const body = await request.json() as HandleUploadBody;
    const token = blobToken(folder);
    const result = await handleUpload({
      body, request, token,
      onBeforeGenerateToken: async (requestedPathname, clientPayload) => {
        const extension = requestedPathname.match(/\.(jpg|png|webp)$/)?.[1];
        if (!extension || !new RegExp(`^${folder}/[a-f0-9-]{36}\\.${extension}$`).test(requestedPathname)) throw new Error('Invalid pathname');
        if (folder === 'products') {
          if (!await adminId()) throw new Error('Unauthorized');
        } else {
          const code = clientPayload || '';
          if (!/^[a-f0-9]{32}$/.test(code)) throw new Error('Invalid order');
          const order = await db().order.findUnique({ where: { code }, select: { status: true } });
          if (!order || !['AWAITING_SLIP', 'REJECTED'].includes(order.status)) throw new Error('Order cannot accept a slip');
        }
        return {
          allowedContentTypes: imageTypes,
          maximumSizeInBytes: maxImageSize,
          validUntil: Date.now() + 5 * 60 * 1000,
        };
      },
      onUploadCompleted: async () => {},
    });
    return Response.json(result);
  } catch {
    return Response.json({ error: 'Upload denied' }, { status: 400 });
  }
}
