import { db } from '@/lib/db';
import { ProductManager } from '@/components/product-manager';

export const dynamic = 'force-dynamic';

export default async function ProductsPage() {
  const [products, categories] = await Promise.all([
    db().product.findMany({
      select: {
        id: true, name: true, description: true, price: true, stock: true,
        active: true, imageKey: true, categoryId: true,
        category: { select: { name: true } },
        _count: { select: { orderItems: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    db().category.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
  ]);
  return <ProductManager products={products} categories={categories}/>;
}
