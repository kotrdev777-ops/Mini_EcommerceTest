import { db } from '@/lib/db';
import { saveStore } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ saved?: string }> }) {
  const store = await db().store.findUniqueOrThrow({ where: { id: 1 } });
  const query = await searchParams;
  return <div className="narrow"><h2>ตั้งค่าร้านค้า</h2>{query.saved && <p className="success">บันทึกเรียบร้อย</p>}<form action={saveStore} className="form-card stack"><div className="field"><label>ชื่อร้าน *</label><input name="name" defaultValue={store.name} required/></div><div className="field"><label>คำอธิบาย</label><textarea name="description" defaultValue={store.description} rows={3}/></div><div className="form-two"><div className="field"><label>เบอร์โทร</label><input name="contactPhone" defaultValue={store.contactPhone}/></div><div className="field"><label>LINE</label><input name="contactLine" defaultValue={store.contactLine}/></div></div><h3>ข้อมูลรับโอนเงิน</h3><div className="field"><label>ชื่อธนาคาร</label><input name="bankName" defaultValue={store.bankName}/></div><div className="field"><label>ชื่อบัญชี</label><input name="bankAccountName" defaultValue={store.bankAccountName}/></div><div className="field"><label>เลขบัญชี</label><input name="bankAccountNumber" defaultValue={store.bankAccountNumber}/></div><div className="field"><label>ค่าจัดส่ง (บาท)</label><input name="shippingFee" type="number" min="0" step="0.01" defaultValue={(store.shippingFee / 100).toFixed(2)} required/></div><button className="button">บันทึกการตั้งค่า</button></form></div>;
}
