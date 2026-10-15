import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { setOrderStatus } from '@/app/actions';

export const dynamic = 'force-dynamic';

const labels = { AWAITING_SLIP: 'รอสลิป', PENDING_REVIEW: 'รอตรวจ', PAID: 'ชำระแล้ว', REJECTED: 'สลิปไม่ผ่าน', CANCELLED: 'ยกเลิก' };

export default async function OrdersPage() {
  const orders = await db().order.findMany({ include: { items: true }, orderBy: { createdAt: 'desc' }, take: 100 });
  return <><h2>คำสั่งซื้อ</h2>{orders.length ? <div className="stack">{orders.map((order) => <details className="form-card order-card" key={order.id}>
    <summary><div><strong>#{order.code.slice(-8).toUpperCase()}</strong><span className="muted"> · {order.customerName}</span></div><div><span className="status small">{labels[order.status]}</span><strong>{baht(order.total)}</strong></div></summary>
    <div className="order-detail"><p><strong>ผู้สั่ง:</strong> {order.customerName} · {order.customerEmail} · {order.customerPhone}</p><p><strong>ที่อยู่:</strong> {order.address}</p>{order.note && <p><strong>หมายเหตุ:</strong> {order.note}</p>}<hr/>
      {order.items.map((item) => <p className="line" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{baht(item.unitPrice * item.quantity)}</strong></p>)}
      <p className="line"><span>{order.shippingMethodName || 'ค่าจัดส่ง'}</span><strong>{baht(order.shippingFee)}</strong></p>
      <p className="line total"><span>รวม</span><strong>{baht(order.total)}</strong></p>
      {order.slipKey && <p><a className="button secondary" target="_blank" rel="noreferrer" href={'/api/media/' + encodeURIComponent(order.slipKey)}>เปิดดูสลิป</a></p>}
      <div className="actions">{order.status === 'PENDING_REVIEW' && <><StatusButton id={order.id} status="PAID" label="ยืนยันชำระเงิน"/><StatusButton id={order.id} status="REJECTED" label="ให้แนบสลิปใหม่"/></>}{['AWAITING_SLIP', 'PENDING_REVIEW', 'REJECTED'].includes(order.status) && <StatusButton id={order.id} status="CANCELLED" label="ยกเลิกออเดอร์"/>}</div>
    </div>
  </details>)}</div> : <div className="empty">ยังไม่มีคำสั่งซื้อ</div>}</>;
}

function StatusButton({ id, status, label }: { id: string; status: string; label: string }) {
  return <form action={setOrderStatus}><input type="hidden" name="id" value={id}/><input type="hidden" name="status" value={status}/><button className={status === 'PAID' ? 'button' : 'button secondary'}>{label}</button></form>;
}
