'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { deleteProduct, saveProduct } from '@/app/actions';
import { ImageUploadForm } from '@/components/image-upload-form';
import { baht } from '@/lib/format';

type Category = { id: string; name: string };
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  imageKey: string | null;
  categoryId: string | null;
  category: { name: string } | null;
  _count: { orderItems: number };
};

export function ProductManager({ products, categories }: { products: Product[]; categories: Category[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<Product | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (panelOpen && !dialog.open) dialog.showModal();
    if (!panelOpen && dialog.open) dialog.close();
  }, [panelOpen]);

  function openPanel(product: Product | null) {
    setSelected(product);
    setPanelOpen(true);
  }

  async function remove(product: Product) {
    if (!window.confirm(`ยืนยันลบสินค้า “${product.name}”?`)) return;
    setDeleteError('');
    setDeletingId(product.id);
    try {
      const result = await deleteProduct(product.id);
      if (result.error) setDeleteError(result.error);
      else router.refresh();
    } catch {
      setDeleteError('ลบสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setDeletingId(null);
    }
  }

  return <>
    <div className="product-management-header"><div><h2>สินค้า</h2><p className="muted">สินค้า {products.length} รายการ</p></div><button className="button" type="button" onClick={() => openPanel(null)}>+ เพิ่มสินค้า</button></div>
    {deleteError && <p className="error" role="alert">{deleteError}</p>}
    {products.length ? <ul className="admin-product-list">{products.map((product) => <li className="admin-product-row" key={product.id}>
      <div className="admin-product-image">{product.imageKey ? <img src={'/api/media/' + encodeURIComponent(product.imageKey)} alt={product.name}/> : <span aria-hidden="true">◈</span>}</div>
      <div className="admin-product-info"><strong>{product.name}</strong><span className="muted">{product.category?.name || 'ไม่ระบุหมวดหมู่'}</span><span className="admin-product-mobile-meta">{baht(product.price)} · คงเหลือ {product.stock}</span></div>
      <div className="admin-product-price">{baht(product.price)}</div>
      <div className="admin-product-stock">คงเหลือ {product.stock}</div>
      <div className="admin-product-state">{product.active ? 'แสดง' : 'ซ่อน'}</div>
      <div className="admin-product-actions"><button type="button" className="button secondary" onClick={() => openPanel(product)}>แก้ไข</button><button type="button" className="link-button danger" disabled={deletingId === product.id || product._count.orderItems > 0} title={product._count.orderItems > 0 ? 'สินค้าที่มีประวัติคำสั่งซื้อไม่สามารถลบได้ ให้ซ่อนสินค้าแทน' : undefined} onClick={() => remove(product)}>{deletingId === product.id ? 'กำลังลบ...' : 'ลบ'}</button></div>
      {product._count.orderItems > 0 && <p className="admin-product-note">มีประวัติคำสั่งซื้อ หากไม่ต้องการแสดงบนหน้าร้านให้กดแก้ไขแล้วปิด “แสดงสินค้า”</p>}
    </li>)}</ul> : <div className="empty"><p>ยังไม่มีสินค้า</p><button className="button" type="button" onClick={() => openPanel(null)}>เพิ่มสินค้าชิ้นแรก</button></div>}

    <dialog ref={dialogRef} className="product-panel" aria-labelledby="product-panel-title" onClose={() => setPanelOpen(false)}>
      <div className="product-panel-header"><div><span className="eyebrow">PRODUCTS</span><h2 id="product-panel-title">{selected ? 'แก้ไขสินค้า' : 'เพิ่มสินค้า'}</h2></div><button type="button" className="product-panel-close" aria-label="ปิดแผงสินค้า" onClick={() => setPanelOpen(false)}>×</button></div>
      <div className="product-panel-body" key={selected?.id || 'new'}>
        <ImageUploadForm folder="products" action={saveProduct} className="product-panel-form stack">
          {selected && <input type="hidden" name="id" value={selected.id}/>}
          {selected?.imageKey && <div className="product-panel-preview"><img src={'/api/media/' + encodeURIComponent(selected.imageKey)} alt={selected.name}/></div>}
          <div className="field"><label htmlFor="product-name">ชื่อสินค้า *</label><input id="product-name" name="name" defaultValue={selected?.name} required maxLength={200}/></div>
          <div className="field"><label htmlFor="product-description">รายละเอียด</label><textarea id="product-description" name="description" defaultValue={selected?.description} rows={4} maxLength={3000}/></div>
          <div className="form-two"><div className="field"><label htmlFor="product-price">ราคา (บาท) *</label><input id="product-price" name="price" type="number" min="0" step="0.01" defaultValue={selected ? (selected.price / 100).toFixed(2) : ''} required/></div><div className="field"><label htmlFor="product-stock">สต็อก *</label><input id="product-stock" name="stock" type="number" min="0" defaultValue={selected?.stock ?? 0} required/></div></div>
          <div className="field"><label htmlFor="product-category">หมวดหมู่</label><select id="product-category" name="categoryId" defaultValue={selected?.categoryId || ''}><option value="">ไม่ระบุ</option>{categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}</select>{!categories.length && <Link href="/admin/categories" className="muted small">เพิ่มหมวดหมู่ก่อนเลือกสินค้า</Link>}</div>
          <div className="field"><label htmlFor="product-image">รูปภาพใหม่ (JPG/PNG/WebP ไม่เกิน 5 MB)</label><input id="product-image" type="file" name="image" accept="image/jpeg,image/png,image/webp"/></div>
          <label className="check"><input type="checkbox" name="active" defaultChecked={selected?.active ?? true}/> แสดงสินค้าบนหน้าร้าน</label>
          <div className="product-panel-footer"><button className="button" type="submit">{selected ? 'บันทึกสินค้า' : 'เพิ่มสินค้า'}</button><button className="button secondary" type="button" onClick={() => setPanelOpen(false)}>ยกเลิก</button></div>
        </ImageUploadForm>
      </div>
    </dialog>
  </>;
}
