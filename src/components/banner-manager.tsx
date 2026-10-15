'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { deleteBannerSlide, saveBannerSlide } from '@/app/actions';

type Slide = {
  id: string; position: number; imageKey: string | null; eyebrow: string; title: string;
  description: string; buttonText: string; link: string; active: boolean;
};
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function BannerManager({ slides }: { slides: Slide[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [selected, setSelected] = useState<Slide | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  function edit(slide: Slide | null) {
    setSelected(slide);
    setError('');
    setOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const data = new FormData(event.currentTarget);
    const file = data.get('image');
    setBusy(true);
    setError('');
    try {
      if (file instanceof File && file.size) {
        if (!extensions[file.type] || file.size > 5 * 1024 * 1024) throw new Error('ใช้ไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB');
        const key = `banners/${crypto.randomUUID()}.${extensions[file.type]}`;
        const signed = await fetch('/api/r2/upload/banners', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ key, contentType: file.type, size: file.size }),
        });
        if (!signed.ok) throw new Error('ขอสิทธิ์อัปโหลดรูปไม่สำเร็จ');
        const { url } = await signed.json() as { url: string };
        const uploaded = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        if (!uploaded.ok) throw new Error('อัปโหลดรูปไม่สำเร็จ กรุณาตรวจการเชื่อมต่อ object storage');
        data.set('imageKey', key);
      }
      data.delete('image');
      const result = await saveBannerSlide(data);
      if (result.error) throw new Error(result.error);
      setOpen(false);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'บันทึก banner ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  async function remove(slide: Slide) {
    if (!window.confirm(`ยืนยันลบสไลด์ “${slide.title}”?`)) return;
    setError('');
    setBusy(true);
    try {
      const result = await deleteBannerSlide(slide.id);
      if (result.error) throw new Error(result.error);
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'ลบสไลด์ไม่สำเร็จ');
    } finally {
      setBusy(false);
    }
  }

  return <section className="banner-settings">
    <div className="product-management-header"><div><h2>Banner หน้าแรก</h2><p className="muted">จัดลำดับและแก้ไขได้สูงสุด 5 สไลด์ ({slides.length}/5)</p></div><button className="button" type="button" disabled={slides.length >= 5} onClick={() => edit(null)}>+ เพิ่มสไลด์</button></div>
    {error && !open && <p className="error" role="alert">{error}</p>}
    {slides.length ? <ul className="admin-product-list">{slides.map((slide) => <li className="admin-banner-row" key={slide.id}>
      <img src={slide.imageKey ? '/api/media/' + encodeURIComponent(slide.imageKey) : '/gift-cart-banner.jpg'} alt=""/>
      <div className="admin-product-info"><strong>{slide.title}</strong><span className="muted">ลำดับ {slide.position} · {slide.active ? 'แสดง' : 'ซ่อน'} · {slide.link || 'ไม่มีลิงก์'}</span></div>
      <div className="admin-product-actions"><button type="button" className="button secondary" onClick={() => edit(slide)}>แก้ไข</button><button type="button" className="link-button danger" disabled={busy} onClick={() => remove(slide)}>ลบ</button></div>
    </li>)}</ul> : <div className="empty">ยังไม่มี banner ที่แสดงบนหน้าแรก</div>}

    <dialog ref={dialogRef} className="product-panel" aria-labelledby="banner-panel-title" onClose={() => setOpen(false)}>
      <div className="product-panel-header"><div><span className="eyebrow">BANNER</span><h2 id="banner-panel-title">{selected ? 'แก้ไขสไลด์' : 'เพิ่มสไลด์'}</h2></div><button type="button" className="product-panel-close" aria-label="ปิดแผง banner" onClick={() => setOpen(false)}>×</button></div>
      <div className="product-panel-body" key={selected?.id || 'new'}>
        <form className="product-panel-form stack" onSubmit={submit}>
          {selected && <input type="hidden" name="id" value={selected.id}/>}
          {selected && <img className="banner-panel-preview" src={selected.imageKey ? '/api/media/' + encodeURIComponent(selected.imageKey) : '/gift-cart-banner.jpg'} alt="ตัวอย่างภาพ banner ปัจจุบัน"/>}
          <div className="field"><label htmlFor="banner-image">รูปภาพ {selected ? 'ใหม่' : '*'} (JPG/PNG/WebP ไม่เกิน 5 MB)</label><input id="banner-image" name="image" type="file" accept="image/jpeg,image/png,image/webp" required={!selected}/></div>
          <div className="field"><label htmlFor="banner-position">ลำดับการแสดง *</label><select id="banner-position" name="position" defaultValue={selected?.position ?? Math.min(slides.length + 1, 5)}>{[1,2,3,4,5].map((number) => <option key={number} value={number}>{number}</option>)}</select></div>
          <div className="field"><label htmlFor="banner-eyebrow">ข้อความบรรทัดบน</label><input id="banner-eyebrow" name="eyebrow" defaultValue={selected?.eyebrow} maxLength={100}/></div>
          <div className="field"><label htmlFor="banner-title">หัวข้อหลัก *</label><textarea id="banner-title" name="title" defaultValue={selected?.title} rows={2} maxLength={200} required/></div>
          <div className="field"><label htmlFor="banner-description">คำอธิบาย</label><textarea id="banner-description" name="description" defaultValue={selected?.description} rows={3} maxLength={500}/></div>
          <div className="field"><label htmlFor="banner-button">ข้อความบนปุ่ม</label><input id="banner-button" name="buttonText" defaultValue={selected?.buttonText} maxLength={100}/></div>
          <div className="field"><label htmlFor="banner-link">ลิงก์ปุ่ม</label><input id="banner-link" name="link" defaultValue={selected?.link} maxLength={1000} placeholder="/#products หรือ https://example.com"/></div>
          <label className="check"><input type="checkbox" name="active" defaultChecked={selected?.active ?? true}/> แสดงสไลด์บนหน้าแรก</label>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="product-panel-footer"><button className="button" disabled={busy}>{busy ? 'กำลังบันทึก...' : 'บันทึกสไลด์'}</button><button type="button" className="button secondary" onClick={() => setOpen(false)}>ยกเลิก</button></div>
        </form>
      </div>
    </dialog>
  </section>;
}
