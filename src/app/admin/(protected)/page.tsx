import Link from 'next/link';
import { db } from '@/lib/db';
import { baht } from '@/lib/format';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [products, orders, pending, recent] = await Promise.all([
    db().product.count(), db().order.count(), db().order.count({ where: { status: 'PENDING_REVIEW' } }),
    db().order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
  ]);
  return <><div className="stats"><div className="stat"><span>สินค้า</span><strong>{products}</strong></div><div className="stat"><span>คำสั่งซื้อ</span><strong>{orders}</strong></div><div className="stat"><span>สลิปรอตรวจ</span><strong>{pending}</strong></div></div><div className="section-heading"><h2>คำสั่งซื้อล่าสุด</h2><Link href="/admin/orders">ดูทั้งหมด →</Link></div><div className="form-card">{recent.length ? recent.map((order) => <div className="line" key={order.id}><span>#{order.code.slice(-8).toUpperCase()} · {order.customerName}</span><strong>{baht(order.total)}</strong></div>) : <p className="muted">ยังไม่มีคำสั่งซื้อ</p>}</div></>;
}
