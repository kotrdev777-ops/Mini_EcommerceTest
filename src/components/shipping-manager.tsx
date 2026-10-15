'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { deleteShippingMethod, saveShippingMethod } from '@/app/actions';
import { baht } from '@/lib/format';

type ShippingMethod = { id: string; name: string; price: number; active: boolean };

export function ShippingManager({ methods }: { methods: ShippingMethod[] }) {
  const router = useRouter();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<ShippingMethod | null>(null);
  const [panelError, setPanelError] = useState('');
  const [listError, setListError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (panelOpen && !dialog.open) dialog.showModal();
    if (!panelOpen && dialog.open) dialog.close();
  }, [panelOpen]);

  function openPanel(method: ShippingMethod | null) {
    setSelected(method);
    setPanelError('');
    setPanelOpen(true);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setPanelError('');
    try {
      const result = await saveShippingMethod(new FormData(event.currentTarget));
      if (result.error) setPanelError(result.error);
      else {
        setPanelOpen(false);
        router.refresh();
      }
    } catch {
      setPanelError('บันทึกวิธีจัดส่งไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  async function remove(method: ShippingMethod) {
    if (!window.confirm(`ยืนยันลบวิธีจัดส่ง “${method.name}”?`)) return;
    setBusy(true);
    setListError('');
    try {
      const result = await deleteShippingMethod(method.id);
      if (result.error) setListError(result.error);
      else router.refresh();
    } catch {
      setListError('ลบวิธีจัดส่งไม่สำเร็จ กรุณาลองอีกครั้ง');
    } finally {
      setBusy(false);
    }
  }

  return <>
    <div className="product-management-header"><div><h2>การจัดส่ง</h2><p className="muted">กำหนดวิธีจัดส่งและราคาที่ลูกค้าเลือกได้ในหน้า checkout</p></div><button className="button" type="button" onClick={() => openPanel(null)}>+ เพิ่มวิธีจัดส่ง</button></div>
    {listError && <p className="error" role="alert">{listError}</p>}
    {methods.length ? <ul className="admin-product-list">{methods.map((method) => <li className="admin-shipping-row" key={method.id}>
      <div className="admin-shipping-name"><strong>{method.name}</strong><span className="muted">{method.active ? 'ลูกค้าเลือกได้' : 'ปิดใช้งาน'}</span></div>
      <strong className="admin-shipping-price">{baht(method.price)}</strong>
      <span className="admin-shipping-state">{method.active ? 'แสดง' : 'ซ่อน'}</span>
      <div className="admin-product-actions"><button className="button secondary" type="button" onClick={() => openPanel(method)}>แก้ไข</button><button className="link-button danger" type="button" disabled={busy} onClick={() => remove(method)}>ลบ</button></div>
    </li>)}</ul> : <div className="empty"><p>ยังไม่มีวิธีจัดส่ง</p><button className="button" type="button" onClick={() => openPanel(null)}>เพิ่มวิธีจัดส่ง</button></div>}

    <dialog ref={dialogRef} className="product-panel" aria-labelledby="shipping-panel-title" onClose={() => setPanelOpen(false)}>
      <div className="product-panel-header"><div><span className="eyebrow">SHIPPING</span><h2 id="shipping-panel-title">{selected ? 'แก้ไขวิธีจัดส่ง' : 'เพิ่มวิธีจัดส่ง'}</h2></div><button type="button" className="product-panel-close" aria-label="ปิดแผงการจัดส่ง" onClick={() => setPanelOpen(false)}>×</button></div>
      <div className="product-panel-body" key={selected?.id || 'new'}><form className="stack" onSubmit={submit}>
        {selected && <input type="hidden" name="id" value={selected.id}/>}
        <div className="field"><label htmlFor="shipping-name">ชื่อวิธีจัดส่ง *</label><input id="shipping-name" name="name" defaultValue={selected?.name} maxLength={100} required placeholder="เช่น จัดส่งมาตรฐาน"/></div>
        <div className="field"><label htmlFor="shipping-price">ค่าจัดส่ง (บาท) *</label><input id="shipping-price" name="price" type="number" min="0" step="0.01" defaultValue={selected ? (selected.price / 100).toFixed(2) : ''} required/></div>
        <label className="check"><input type="checkbox" name="active" defaultChecked={selected?.active ?? true}/> เปิดให้ลูกค้าเลือกวิธีนี้</label>
        {panelError && <p className="error" role="alert">{panelError}</p>}
        <div className="product-panel-footer"><button className="button" type="submit" disabled={busy}>{busy ? 'กำลังบันทึก...' : selected ? 'บันทึกวิธีจัดส่ง' : 'เพิ่มวิธีจัดส่ง'}</button><button className="button secondary" type="button" onClick={() => setPanelOpen(false)}>ยกเลิก</button></div>
      </form></div>
    </dialog>
  </>;
}
