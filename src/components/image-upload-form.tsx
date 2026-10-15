'use client';

import { useRef, useState, type FormEvent, type ReactNode } from 'react';

const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

export function ImageUploadForm({ folder, orderCode, action, className, children }: {
  folder: 'products' | 'slips'; orderCode?: string; action?: (form: FormData) => void | Promise<void>;
  className?: string; children: ReactNode;
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = formRef.current;
    if (!form) return;
    const data = new FormData(form);
    const file = data.get(folder === 'products' ? 'image' : 'slip');
    if (!(file instanceof File) || !file.size) {
      if (folder === 'products') {
        setBusy(true);
        setError('');
        try {
          data.delete('image');
          await action?.(data);
        } catch (error) {
          console.error('[product-form] save failed', error);
          setError('บันทึกสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง');
          setBusy(false);
          return;
        }
        window.location.assign('/admin/products');
      } else setError('กรุณาเลือกรูปสลิป');
      return;
    }
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024) {
      setError('ใช้ไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB');
      return;
    }
    setBusy(true);
    setError('');
    let stage: 'upload' | 'save' = 'upload';
    try {
      const key = `${folder}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const signed = await fetch(`/api/r2/upload/${folder}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, contentType: file.type, size: file.size, orderCode }),
      });
      if (!signed.ok) throw new Error('Could not authorize upload');
      const { url } = await signed.json() as { url: string };
      const uploaded = await fetch(url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
      if (!uploaded.ok) throw new Error('R2 upload failed');
      if (folder === 'products') {
        data.delete('image');
        data.set('imageKey', key);
        stage = 'save';
        await action?.(data);
      } else {
        stage = 'save';
        const response = await fetch(`/api/orders/${orderCode}/slip`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageKey: key }),
        });
        if (!response.ok) throw new Error('บันทึกสลิปไม่สำเร็จ');
      }
    } catch (error) {
      console.error(`[image-form] ${stage} failed`, error);
      setError(stage === 'upload'
        ? error instanceof TypeError ? 'เชื่อมต่อ R2 ไม่ได้ กรุณาตรวจ CORS ของ bucket ให้รองรับ origin ของเว็บ' : 'อัปโหลดไฟล์ไม่สำเร็จ กรุณาลองอีกครั้ง'
        : folder === 'products' ? 'อัปโหลดสำเร็จ แต่บันทึกสินค้าไม่สำเร็จ' : 'อัปโหลดสำเร็จ แต่บันทึกสลิปไม่สำเร็จ');
      setBusy(false);
      return;
    }
    window.location.assign(folder === 'products' ? '/admin/products' : `/order/${orderCode}?uploaded=1`);
  }

  return <form ref={formRef} onSubmit={submit} className={className}>{children}{error && <p className="error" role="alert">{error}</p>}{busy && <p className="muted">กำลังอัปโหลด...</p>}</form>;
}
