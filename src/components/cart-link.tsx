'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const storageKey = 'mini-ecom-cart';

function cartCount() {
  try {
    const items = JSON.parse(localStorage.getItem(storageKey) || '[]');
    if (!Array.isArray(items)) return 0;
    return items.reduce((total, item) => total + (Number.isSafeInteger(item?.quantity) && item.quantity > 0 ? item.quantity : 0), 0);
  } catch { return 0; }
}

export function CartLink() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const update = () => setCount(cartCount());
    update();
    window.addEventListener('cart-changed', update);
    window.addEventListener('storage', update);
    return () => {
      window.removeEventListener('cart-changed', update);
      window.removeEventListener('storage', update);
    };
  }, []);

  return <Link className="cart-link" href="/cart" aria-label={`ตะกร้า ${count} ชิ้น`}><span>ตะกร้า</span>{count > 0 && <span className="cart-badge" aria-hidden="true">{count}</span>}</Link>;
}
