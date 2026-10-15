import Link from 'next/link';
import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { SalesFilter, type SalesPeriod } from '@/components/sales-filter';

export const dynamic = 'force-dynamic';

function bangkokToday() {
  return new Date(Date.now() + 7 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function shiftDay(date: string, days: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return value.toISOString().slice(0, 10);
}

export default async function Dashboard({ searchParams }: { searchParams: Promise<{ period?: string; date?: string }> }) {
  const query = await searchParams;
  const period: SalesPeriod = ['today', 'week', 'month', 'day'].includes(query.period || '') ? query.period as SalesPeriod : 'today';
  const today = bangkokToday();
  const validDate = typeof query.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(query.date) && !Number.isNaN(Date.parse(`${query.date}T00:00:00Z`)) && new Date(`${query.date}T00:00:00Z`).toISOString().slice(0, 10) === query.date;
  const selectedDate = validDate ? query.date! : today;
  const startDay = period === 'week' ? shiftDay(today, -6) : period === 'month' ? shiftDay(today, -29) : period === 'day' ? selectedDate : today;
  const endDay = period === 'day' ? shiftDay(selectedDate, 1) : shiftDay(today, 1);
  const start = new Date(`${startDay}T00:00:00+07:00`);
  const end = new Date(`${endDay}T00:00:00+07:00`);
  const [products, orders, pending, recent, sales] = await Promise.all([
    db().product.count(), db().order.count(), db().order.count({ where: { status: 'PENDING_REVIEW' } }),
    db().order.findMany({ take: 5, orderBy: { createdAt: 'desc' } }),
    db().order.aggregate({ where: { status: 'PAID', paidAt: { gte: start, lt: end } }, _sum: { total: true }, _count: { _all: true } }),
  ]);
  return <><div className="stats dashboard-stats"><div className="stat"><span>สินค้า</span><strong>{products}</strong></div><div className="stat"><span>คำสั่งซื้อ</span><strong>{orders}</strong></div><div className="stat"><span>สลิปรอตรวจ</span><strong>{pending}</strong></div><div className="stat sales-stat"><span>ยอดขาย</span><strong>{baht(sales._sum.total ?? 0)}</strong><small>ชำระแล้ว {sales._count._all} คำสั่งซื้อ</small><SalesFilter period={period} date={selectedDate}/></div></div><div className="section-heading"><h2>คำสั่งซื้อล่าสุด</h2><Link href="/admin/orders">ดูทั้งหมด →</Link></div><div className="form-card">{recent.length ? recent.map((order) => <div className="line" key={order.id}><span>#{order.code.slice(-8).toUpperCase()} · {order.customerName}</span><strong>{baht(order.total)}</strong></div>) : <p className="muted">ยังไม่มีคำสั่งซื้อ</p>}</div></>;
}
