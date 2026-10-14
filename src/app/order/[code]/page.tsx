import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { ImageUploadForm } from '@/components/image-upload-form';

export const dynamic = 'force-dynamic';

const labels = {
  AWAITING_SLIP: 'รอแนบสลิป', PENDING_REVIEW: 'รอตรวจสอบสลิป',
  PAID: 'ชำระเงินแล้ว', REJECTED: 'สลิปไม่ผ่าน กรุณาแนบใหม่', CANCELLED: 'ยกเลิกแล้ว',
};

export default async function OrderPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ error?: string; uploaded?: string }> }) {
  const { code } = await params;
  if (!/^[a-f0-9]{32}$/.test(code)) notFound();
  const [order, store, query] = await Promise.all([
    db().order.findUnique({ where: { code }, include: { items: true } }),
    db().store.findUnique({ where: { id: 1 } }),
    searchParams,
  ]);
  if (!order || !store) notFound();
  return <div className="container section narrow"><span className="eyebrow">ORDER CONFIRMED</span><h1>คำสั่งซื้อ #{code.slice(-8).toUpperCase()}</h1><div className="status">{labels[order.status]}</div>{query.uploaded && <p className="success">ส่งสลิปเรียบร้อย ร้านค้าจะตรวจสอบและอัปเดตสถานะ</p>}{query.error && <p className="error">อัปโหลดสลิปไม่สำเร็จ กรุณาใช้ไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB</p>}
    <div className="form-card"><h2>รายการสินค้า</h2>{order.items.map((item) => <p className="line" key={item.id}><span>{item.name} × {item.quantity}</span><strong>{baht(item.unitPrice * item.quantity)}</strong></p>)}<hr/><p className="line"><span>ค่าจัดส่ง</span><strong>{baht(order.shippingFee)}</strong></p><p className="line total"><span>ยอดโอน</span><strong>{baht(order.total)}</strong></p></div>
    {['AWAITING_SLIP', 'REJECTED'].includes(order.status) && <div className="form-card"><h2>โอนเงินและแนบสลิป</h2><div className="bank-box"><p>{store.bankName || 'ชื่อธนาคารยังไม่ได้ตั้งค่า'}</p><strong>{store.bankAccountNumber || 'เลขบัญชียังไม่ได้ตั้งค่า'}</strong><p>{store.bankAccountName}</p></div><ImageUploadForm folder="slips" orderCode={code}><div className="field"><label>รูปสลิป *</label><input type="file" name="slip" accept="image/jpeg,image/png,image/webp" required/></div><button className="button">ส่งสลิป</button></ImageUploadForm></div>}
    <p className="muted small">เก็บลิงก์หน้านี้ไว้เพื่อตรวจสอบสถานะคำสั่งซื้อ</p>
  </div>;
}
