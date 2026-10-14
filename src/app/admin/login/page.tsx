import { db } from '@/lib/db';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { login } from '@/app/actions';
import { adminId } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (!await db().admin.count()) redirect('/setup');
  if (await adminId()) redirect('/admin');
  const query = await searchParams;
  return <div className="container section narrow"><span className="eyebrow">BACK OFFICE</span><h1>เข้าสู่ระบบหลังบ้าน</h1><form action={login} className="form-card stack"><div className="field"><label>อีเมล</label><input name="email" type="email" required/></div><div className="field"><label>รหัสผ่าน</label><input name="password" type="password" required/></div>{query.error && <p className="error">อีเมลหรือรหัสผ่านไม่ถูกต้อง</p>}<button className="button wide">เข้าสู่ระบบ</button></form><p><Link href="/">← กลับหน้าร้าน</Link></p></div>;
}
