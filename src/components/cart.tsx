'use client';

import { useEffect, useState, useActionState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createOrder } from '@/app/actions';
import { baht } from '@/lib/format';

export type CartItem = { id: string; name: string; price: number; quantity: number; stock: number };
export type ShippingOption = { id: string; name: string; price: number };
const storageKey = 'mini-ecom-cart';

function readCart(): CartItem[] {
  try { return JSON.parse(localStorage.getItem(storageKey) || '[]'); } catch { return []; }
}

export function AddToCart({ id, name, price, stock }: Omit<CartItem, 'quantity'>) {
  const [added, setAdded] = useState(false);
  return <button className="button" type="button" disabled={stock < 1} onClick={() => {
    const cart = readCart();
    const existing = cart.find((item) => item.id === id);
    if (existing) existing.quantity = Math.min(stock, existing.quantity + 1);
    else cart.push({ id, name, price, stock, quantity: 1 });
    localStorage.setItem(storageKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('cart-changed'));
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }}>{stock < 1 ? 'สินค้าหมด' : added ? 'เพิ่มแล้ว ✓' : 'เพิ่มลงตะกร้า'}</button>;
}

export function CartView() {
  const [items, setItems] = useState<CartItem[]>([]);
  useEffect(() => { setItems(readCart()); }, []);
  function update(id: string, quantity: number) {
    const next = items.map((item) => item.id === id ? { ...item, quantity: Math.min(item.stock, Math.max(0, quantity)) } : item).filter((item) => item.quantity > 0);
    setItems(next);
    localStorage.setItem(storageKey, JSON.stringify(next));
    window.dispatchEvent(new Event('cart-changed'));
  }
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <div className="container section narrow"><span className="eyebrow">YOUR BAG</span><h1>ตะกร้าสินค้า</h1>{items.length ? <>
    <div className="stack">{items.map((item) => <div className="cart-row" key={item.id}><div><strong>{item.name}</strong><p className="muted">{baht(item.price)} / ชิ้น</p></div><div className="quantity"><button onClick={() => update(item.id, item.quantity - 1)}>−</button><span>{item.quantity}</span><button onClick={() => update(item.id, item.quantity + 1)}>+</button></div><strong>{baht(item.price * item.quantity)}</strong></div>)}</div>
    <div className="summary"><p>สินค้า <strong>{baht(subtotal)}</strong></p><p>ค่าจัดส่ง <span className="muted">เลือกในขั้นตอนถัดไป</span></p><p className="total">ยอดสินค้า <strong>{baht(subtotal)}</strong></p></div>
    <Link className="button wide" href="/checkout">ดำเนินการสั่งซื้อ →</Link>
  </> : <div className="empty"><p>ยังไม่มีสินค้าในตะกร้า</p><Link className="button" href="/">เลือกดูสินค้า</Link></div>}</div>;
}

export function CheckoutForm({ shippingMethods }: { shippingMethods: ShippingOption[] }) {
  const router = useRouter();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [shippingMethodId, setShippingMethodId] = useState(shippingMethods[0]?.id || '');
  const [state, action, pending] = useActionState(createOrder, {});
  useEffect(() => { setCart(readCart()); }, []);
  useEffect(() => { if (state.code) { localStorage.removeItem(storageKey); window.dispatchEvent(new Event('cart-changed')); router.push('/order/' + state.code); } }, [state.code, router]);
  const selectedMethod = shippingMethods.find((method) => method.id === shippingMethodId);
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  return <div className="container section checkout-grid"><div><span className="eyebrow">CHECKOUT</span><h1>ข้อมูลจัดส่ง</h1>
    <form action={action} className="form-card"><input type="hidden" name="cart" value={JSON.stringify(cart.map(({ id, quantity }) => ({ id, quantity })))}/>
      <div className="field"><label>ชื่อผู้รับ *</label><input name="customerName" required maxLength={200}/></div>
      <div className="field"><label>อีเมล *</label><input name="customerEmail" type="email" required maxLength={200}/></div>
      <div className="field"><label>เบอร์โทร *</label><input name="customerPhone" type="tel" required maxLength={100}/></div>
      <div className="field"><label>ที่อยู่จัดส่ง *</label><textarea name="address" required rows={4} maxLength={1000}/></div>
      <fieldset className="shipping-options"><legend>วิธีจัดส่ง *</legend>{shippingMethods.length ? shippingMethods.map((method) => <label className={shippingMethodId === method.id ? 'shipping-option active' : 'shipping-option'} key={method.id}><input type="radio" name="shippingMethodId" value={method.id} checked={shippingMethodId === method.id} onChange={() => setShippingMethodId(method.id)} required/><span>{method.name}</span><strong>{baht(method.price)}</strong></label>) : <p className="error">ขณะนี้ยังไม่มีวิธีจัดส่ง กรุณาติดต่อร้านค้า</p>}</fieldset>
      <div className="field"><label>หมายเหตุ</label><textarea name="note" rows={2} maxLength={1000}/></div>
      {state.error && <p className="error">{state.error}</p>}
      <button className="button wide" disabled={pending || !cart.length || !selectedMethod}>{pending ? 'กำลังบันทึก...' : 'ยืนยันคำสั่งซื้อ'}</button>
      <p className="muted small">ขั้นต่อไป: โอนเงินและแนบสลิป ร้านค้าจะตรวจสอบก่อนยืนยัน</p>
    </form>
  </div><aside className="form-card order-summary"><h2>สรุปคำสั่งซื้อ</h2>{cart.map((item) => <p key={item.id}>{item.name} × {item.quantity}<strong>{baht(item.price * item.quantity)}</strong></p>)}<hr/><p>{selectedMethod?.name || 'ค่าจัดส่ง'}<strong>{selectedMethod ? baht(selectedMethod.price) : '—'}</strong></p><p className="total">ยอดชำระ<strong>{baht(subtotal + (selectedMethod?.price || 0))}</strong></p></aside></div>;
}
