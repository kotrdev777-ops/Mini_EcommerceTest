'use client';

import { uploadPresigned } from '@vercel/blob/client';
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
          window.location.assign('/admin/products');
        } catch {
          setError('บันทึกสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง');
          setBusy(false);
        }
      } else setError('กรุณาเลือกรูปสลิป');
      return;
    }
    if (!extensions[file.type] || file.size > 5 * 1024 * 1024) {
      setError('ใช้ไฟล์ JPG, PNG หรือ WebP ขนาดไม่เกิน 5 MB');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const key = `${folder}/${crypto.randomUUID()}.${extensions[file.type]}`;
      const blob = await uploadPresigned(key, file, {
        access: folder === 'products' ? 'public' : 'private',
        handleUploadUrl: `/api/blob/upload/${folder}`,
        clientPayload: orderCode,
      });
      if (folder === 'products') {
        data.delete('image');
        data.set('imageKey', blob.pathname);
        await action?.(data);
        window.location.assign('/admin/products');
      } else {
        const response = await fetch(`/api/orders/${orderCode}/slip`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ imageKey: blob.pathname }),
        });
        if (!response.ok) throw new Error('บันทึกสลิปไม่สำเร็จ');
        window.location.href = `/order/${orderCode}?uploaded=1`;
      }
    } catch {
      setError(folder === 'products' ? 'อัปโหลดหรือบันทึกสินค้าไม่สำเร็จ กรุณาลองอีกครั้ง' : 'อัปโหลดสลิปไม่สำเร็จ กรุณาลองอีกครั้ง');
      setBusy(false);
    }
  }

  return <form ref={formRef} onSubmit={submit} className={className}>{children}{error && <p className="error" role="alert">{error}</p>}{busy && <p className="muted">กำลังอัปโหลด...</p>}</form>;
}
