import { db } from '@/lib/db';
import { uploadImage } from '@/lib/storage';

export const runtime = 'nodejs';

function backToOrder(code: string, query = '') {
  return new Response(null, { status: 303, headers: { Location: '/order/' + code + query } });
}

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^[a-f0-9]{32}$/.test(code)) return new Response('Not found', { status: 404 });
  const order = await db().order.findUnique({ where: { code } });
  if (!order) return new Response('Not found', { status: 404 });
  if (!['AWAITING_SLIP', 'REJECTED'].includes(order.status)) return backToOrder(code);
  try {
    const length = Number(request.headers.get('content-length') || 0);
    if (length > 6 * 1024 * 1024) throw new Error('File too large');
    const form = await request.formData();
    const file = form.get('slip');
    if (!(file instanceof File)) throw new Error('Missing slip');
    const key = await uploadImage(file, 'slips');
    const result = await db().order.updateMany({ where: { id: order.id, status: order.status }, data: { slipKey: key, status: 'PENDING_REVIEW' } });
    if (!result.count) throw new Error('Order status changed');
    return backToOrder(code, '?uploaded=1');
  } catch {
    return backToOrder(code, '?error=1');
  }
}
