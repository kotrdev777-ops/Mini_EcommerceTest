'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const items = [
  { href: '/admin', label: 'ภาพรวม' },
  { href: '/admin/products', label: 'สินค้า' },
  { href: '/admin/categories', label: 'หมวดหมู่' },
  { href: '/admin/shipping', label: 'การจัดส่ง' },
  { href: '/admin/orders', label: 'คำสั่งซื้อ' },
  { href: '/admin/settings', label: 'ตั้งค่า' },
];

export function AdminNav() {
  const pathname = usePathname();
  return <nav className="admin-nav">{items.map(({ href, label }) =>
    <Link key={href} href={href} className={pathname === href ? 'active' : undefined} aria-current={pathname === href ? 'page' : undefined}>{label}</Link>
  )}</nav>;
}
