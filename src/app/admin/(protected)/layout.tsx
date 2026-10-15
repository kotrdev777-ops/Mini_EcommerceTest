import { requireAdmin } from '@/lib/auth';
import { logout } from '@/app/actions';
import { AdminNav } from '@/components/admin-nav';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return <div className="admin-shell"><aside className="admin-sidebar"><div className="admin-brand">BACK OFFICE<small>จัดการร้านค้า</small></div><AdminNav/><div className="admin-sidebar-bottom"><strong>พื้นที่จัดการร้านค้า</strong><form action={logout}><button className="link-button">ออกจากระบบ</button></form></div></aside><div className="admin-content"><div className="admin-content-inner"><div className="admin-page-heading"><span className="eyebrow">BACK OFFICE</span><h1>จัดการร้านค้า</h1></div>{children}</div></div></div>;
}
