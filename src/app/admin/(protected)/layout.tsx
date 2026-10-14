import Link from 'next/link';
import { requireAdmin } from '@/lib/auth';
import { logout } from '@/app/actions';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="container section"><div className="admin-nav"><div><span className="eyebrow">BACK OFFICE</span><h1>จัดการร้านค้า</h1></div><nav><Link href="/admin">ภาพรวม</Link><Link href="/admin/products">สินค้า</Link><Link href="/admin/orders">คำสั่งซื้อ</Link><Link href="/admin/settings">ตั้งค่า</Link><form action={logout}><button className="link-button">ออกจากระบบ</button></form></nav></div>{children}</div>;
}
