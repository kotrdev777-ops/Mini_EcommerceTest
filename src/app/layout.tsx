import type { Metadata } from 'next';
import Link from 'next/link';
import { db } from '@/lib/db';
import './globals.css';

export const metadata: Metadata = { title: 'Mini E-commerce', description: 'ร้านค้าออนไลน์พร้อมใช้งาน' };

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let name = 'Mini E-commerce';
  try { name = (await db().store.findUnique({ where: { id: 1 } }))?.name || name; } catch { /* DB may not be set up yet. */ }
  return <html lang="th"><body>
    <header className="site-header"><div className="container header-inner">
      <Link className="brand" href="/">◈ <span>{name}</span></Link>
      <nav><Link href="/">สินค้า</Link><Link href="/cart">ตะกร้า</Link><Link href="/admin">หลังบ้าน</Link></nav>
    </div></header>
    <main>{children}</main>
    <footer className="site-footer"><div className="container">© {new Date().getFullYear()} {name}</div></footer>
  </body></html>;
}
