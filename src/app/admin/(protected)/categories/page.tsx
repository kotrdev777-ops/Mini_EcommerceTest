import Link from 'next/link';
import { db } from '@/lib/db';
import { deleteCategory, saveCategory } from '@/app/actions';

export const dynamic = 'force-dynamic';

const errors: Record<string, string> = {
  name: 'กรุณาระบุชื่อหมวดหมู่',
  duplicate: 'มีหมวดหมู่ชื่อนี้แล้ว',
  missing: 'ไม่พบหมวดหมู่ กรุณาโหลดหน้าใหม่',
  'not-empty': 'หมวดหมู่นี้ยังมีสินค้า กรุณาย้ายสินค้าไปหมวดอื่นก่อนลบ',
};

export default async function CategoriesPage({ searchParams }: { searchParams: Promise<{ saved?: string; deleted?: string; error?: string }> }) {
  const [categories, query] = await Promise.all([
    db().category.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { products: true } } } }),
    searchParams,
  ]);
  const error = query.error && Object.hasOwn(errors, query.error) ? errors[query.error] : null;
  return <div className="categories-page">
    <div className="section-heading"><div><h2>หมวดหมู่</h2><p className="muted">เพิ่มและแก้ไขหมวดหมู่ที่ใช้จัดสินค้าในหน้าร้าน</p></div><span className="muted">{categories.length} หมวดหมู่</span></div>
    {query.saved && <p className="success" role="status">บันทึกหมวดหมู่แล้ว</p>}
    {query.deleted && <p className="success" role="status">ลบหมวดหมู่แล้ว</p>}
    {error && <p className="error" role="alert">{error}</p>}
    <form action={saveCategory} className="form-card category-create"><div className="field"><label htmlFor="new-category">ชื่อหมวดหมู่ *</label><input id="new-category" name="name" maxLength={100} required/></div><button className="button">เพิ่มหมวดหมู่</button></form>
    <h3>หมวดหมู่ทั้งหมด</h3>
    {categories.length ? <div className="category-admin-list">{categories.map((category) => <div className="category-admin-row" key={category.id}>
      <form action={saveCategory} className="category-edit-form"><input type="hidden" name="id" value={category.id}/><div className="field"><label htmlFor={'category-' + category.id}>ชื่อหมวดหมู่</label><input id={'category-' + category.id} name="name" defaultValue={category.name} maxLength={100} required/></div><button className="button secondary">บันทึกชื่อ</button></form>
      <div className="category-admin-meta"><span>สินค้า {category._count.products} รายการ</span>{category._count.products ? <Link href="/admin/products">ย้ายสินค้าออกก่อนลบ</Link> : <details className="category-delete"><summary>ลบหมวดหมู่</summary><form action={deleteCategory}><input type="hidden" name="id" value={category.id}/><p>ยืนยันลบ “{category.name}”?</p><button className="button secondary">ยืนยันลบ</button></form></details>}</div>
    </div>)}</div> : <div className="empty">ยังไม่มีหมวดหมู่ เพิ่มหมวดหมู่แรกได้จากฟอร์มด้านบน</div>}
  </div>;
}
