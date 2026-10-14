import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { AddToCart } from '@/components/cart';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await db().product.findUnique({ where: { id }, include: { category: true } });
  if (!product || !product.active) notFound();
  return <section className="container section detail-grid"><div className="detail-image">{product.imageKey ? <img src={'/api/media/' + encodeURIComponent(product.imageKey)} alt={product.name}/> : <span>◈</span>}</div><div className="detail-copy"><span className="eyebrow">{product.category?.name || 'สินค้า'}</span><h1>{product.name}</h1><p className="big-price">{baht(product.price)}</p><p className="muted">{product.description || 'ไม่มีรายละเอียดเพิ่มเติม'}</p><p className="muted">{product.stock > 0 ? 'มีสินค้า ' + product.stock + ' ชิ้น' : 'สินค้าหมด'}</p><AddToCart id={product.id} name={product.name} price={product.price} stock={product.stock}/></div></section>;
}
