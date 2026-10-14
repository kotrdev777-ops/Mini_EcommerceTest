import { CheckoutForm } from '@/components/cart';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const store = await db().store.findUnique({ where: { id: 1 } });
  return <CheckoutForm shippingFee={store?.shippingFee || 0}/>;
}
