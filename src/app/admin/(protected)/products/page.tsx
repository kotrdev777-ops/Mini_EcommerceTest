import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { addCategory, saveProduct } from '@/app/actions';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    db().product.findMany({ include: { category: true }, orderBy: { createdAt: 'desc' } }),
    db().category.findMany({ orderBy: { name: 'asc' } }),
  ]);
  return <div className="admin-grid"><div><h2>สินค้า</h2><div className="form-card stack">{products.length ? products.map((product) => <details key={product.id} className="product-edit"><summary><strong>{product.name}</strong><span>{baht(product.price)} · คงเหลือ {product.stock} · {product.active ? 'แสดง' : 'ซ่อน'}</span></summary><form action={saveProduct} className="stack"><input type="hidden" name="id" value={product.id}/><ProductFields categories={categories} product={product}/><button className="button">บันทึกสินค้า</button></form></details>) : <p className="muted">ยังไม่มีสินค้า</p>}</div></div><div className="stack"><div><h2>เพิ่มสินค้า</h2><form action={saveProduct} className="form-card stack"><ProductFields categories={categories}/><button className="button wide">เพิ่มสินค้า</button></form></div><div><h2>เพิ่มหมวดหมู่</h2><form action={addCategory} className="form-card inline-form"><input name="name" placeholder="ชื่อหมวดหมู่" required/><button className="button">เพิ่ม</button></form></div></div></div>;
}

function ProductFields({ categories, product }: { categories: Array<{ id: string; name: string }>; product?: { name: string; description: string; price: number; stock: number; categoryId: string | null; active: boolean; imageKey: string | null } }) {
  return <><div className="field"><label>ชื่อสินค้า *</label><input name="name" defaultValue={product?.name} required maxLength={200}/></div><div className="field"><label>รายละเอียด</label><textarea name="description" defaultValue={product?.description} rows={3}/></div><div className="form-two"><div className="field"><label>ราคา (บาท) *</label><input name="price" type="number" min="0" step="0.01" defaultValue={product ? (product.price / 100).toFixed(2) : ''} required/></div><div className="field"><label>สต็อก *</label><input name="stock" type="number" min="0" defaultValue={product?.stock ?? 0} required/></div></div><div className="field"><label>หมวดหมู่</label><select name="categoryId" defaultValue={product?.categoryId || ''}><option value="">ไม่ระบุ</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select></div><div className="field"><label>รูปภาพ (JPG/PNG/WebP ไม่เกิน 5 MB)</label><input type="file" name="image" accept="image/jpeg,image/png,image/webp"/></div><label className="check"><input type="checkbox" name="active" defaultChecked={product?.active ?? true}/> แสดงสินค้าบนหน้าร้าน</label></>;
}
