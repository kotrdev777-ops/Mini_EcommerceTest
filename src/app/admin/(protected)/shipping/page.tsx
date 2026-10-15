import { db } from '@/lib/db';
import { ShippingManager } from '@/components/shipping-manager';

export const dynamic = 'force-dynamic';

export default async function ShippingPage() {
  const methods = await db().shippingMethod.findMany({
    select: { id: true, name: true, price: true, active: true },
    orderBy: { createdAt: 'asc' },
  });
  return <ShippingManager methods={methods}/>;
}
