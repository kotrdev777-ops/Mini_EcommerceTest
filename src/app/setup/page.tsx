import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import { setup } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function SetupPage() {
  if (await db().admin.count()) redirect('/admin/login');
  return <div className="container section narrow"><span className="eyebrow">ONE TIME SETUP</span><h1>ตั้งค่าร้านครั้งแรก</h1><p className="muted">กรอกรหัสเริ่มต้นที่ได้รับมาพร้อมแอปเพื่อสร้างร้านและ Admin ครั้งแรก</p><form action={setup} className="form-card stack"><div className="field"><label>รหัสเริ่มต้น *</label><input name="starterPassword" type="password" required/></div><div className="field"><label>ชื่อร้าน *</label><input name="name" required/></div><div className="field"><label>อีเมล Admin *</label><input name="email" type="email" required/></div><div className="field"><label>รหัสผ่าน Admin (อย่างน้อย 8 ตัวอักษร) *</label><input name="password" type="password" minLength={8} required/></div><div className="field"><label>ธนาคารรับโอน *</label><input name="bankName" required/></div><div className="field"><label>ชื่อบัญชี *</label><input name="bankAccountName" required/></div><div className="field"><label>เลขบัญชี *</label><input name="bankAccountNumber" required/></div><button className="button wide">สร้างร้านค้า</button></form></div>;
}
