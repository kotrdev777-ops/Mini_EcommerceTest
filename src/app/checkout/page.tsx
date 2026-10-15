import { CheckoutForm } from '@/components/cart';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function CheckoutPage() {
  const shippingMethods = await db().shippingMethod.findMany({
    where: { active: true },
    select: { id: true, name: true, price: true },
    orderBy: { createdAt: 'asc' },
  });
  return <CheckoutForm shippingMethods={shippingMethods}/>;
}
