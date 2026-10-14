import { CartView } from '@/components/cart';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CartPage() {
  const store = await db().store.findUnique({ where: { id: 1 } });
  return <CartView shippingFee={store?.shippingFee || 0}/>;
}
