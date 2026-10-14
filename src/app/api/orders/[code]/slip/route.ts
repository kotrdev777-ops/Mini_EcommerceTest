import { db } from '@/lib/db';
import { verifiedImage } from '@/lib/storage';

export const runtime = 'nodejs';

export async function POST(request: Request, context: { params: Promise<{ code: string }> }) {
  const { code } = await context.params;
  if (!/^[a-f0-9]{32}$/.test(code)) return new Response('Not found', { status: 404 });
  const order = await db().order.findUnique({ where: { code } });
  if (!order) return new Response('Not found', { status: 404 });
  if (!['AWAITING_SLIP', 'REJECTED'].includes(order.status)) return Response.json({ error: 'Order status changed' }, { status: 409 });
  try {
    const body = await request.json() as { imageKey?: unknown };
    if (typeof body.imageKey !== 'string') throw new Error('Missing slip');
    const key = body.imageKey;
    await verifiedImage(key, 'slips');
    const result = await db().order.updateMany({ where: { id: order.id, status: order.status }, data: { slipKey: key, status: 'PENDING_REVIEW' } });
    if (!result.count) throw new Error('Order status changed');
    return Response.json({ ok: true });
  } catch {
    return Response.json({ error: 'Invalid slip' }, { status: 400 });
  }
}
