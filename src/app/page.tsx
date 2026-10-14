import Link from 'next/link';
import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { AddToCart } from '@/components/cart';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = await searchParams;
  const store = await db().store.findUnique({ where: { id: 1 } });
  if (!store) return <section className="container narrow empty"><h1>ร้านค้ายังไม่พร้อมใช้งาน</h1><p>เจ้าของร้านโปรดไปที่หน้า <Link href="/setup">ตั้งค่าครั้งแรก</Link></p></section>;
  const [categories, products] = await Promise.all([
    db().category.findMany({ orderBy: { name: 'asc' } }),
    db().product.findMany({ where: { active: true, ...(category ? { categoryId: category } : {}) }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
  ]);
  return <>
    <section className="hero"><div className="container hero-inner"><div><span className="eyebrow">WELCOME TO OUR SHOP</span><h1>{store.name}</h1><p>{store.description || 'คัดสรรสินค้าที่คุณชอบ สั่งง่าย ส่งถึงบ้าน'}</p><a className="button light" href="#products">เลือกดูสินค้า ↓</a></div><div className="hero-art">✦<span>ช้อปได้<br/>ทุกวัน</span></div></div></section>
    <section className="container section" id="products"><div className="section-heading"><div><span className="eyebrow">OUR COLLECTION</span><h2>สินค้าทั้งหมด</h2></div><span className="muted">{products.length} รายการ</span></div>
      <div className="chips"><Link className={!category ? 'chip active' : 'chip'} href="/">ทั้งหมด</Link>{categories.map((item) => <Link key={item.id} className={category === item.id ? 'chip active' : 'chip'} href={'/?category=' + item.id}>{item.name}</Link>)}</div>
      {products.length ? <div className="product-grid">{products.map((item) => <article className="product-card" key={item.id}>
        <Link href={'/product/' + item.id} className="product-image">{item.imageKey ? <img src={'/api/media/' + encodeURIComponent(item.imageKey)} alt={item.name}/> : <span>◈</span>}</Link>
        <div className="product-info"><span className="eyebrow">{item.category?.name || 'สินค้า'}</span><Link href={'/product/' + item.id}><h3>{item.name}</h3></Link><p>{baht(item.price)}</p><AddToCart id={item.id} name={item.name} price={item.price} stock={item.stock}/></div>
      </article>)}</div> : <div className="empty">ยังไม่มีสินค้าในหมวดนี้</div>}
    </section>
    <section className="contact-strip"><div className="container"><h2>ติดต่อร้านค้า</h2><p>{store.contactPhone || 'เบอร์โทรยังไม่ได้ตั้งค่า'}{store.contactLine ? ' · LINE: ' + store.contactLine : ''}</p></div></section>
  </>;
}
