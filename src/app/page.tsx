import Link from 'next/link';
import { db } from '@/lib/db';
import { baht } from '@/lib/format';
import { AddToCart } from '@/components/cart';
import { BannerCarousel } from '@/components/banner-carousel';

export const dynamic = 'force-dynamic';

export default async function Home({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const params = await searchParams;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const q = typeof params.q === 'string' ? params.q.trim().slice(0, 100) : '';
  function categoryHref(selected?: string) {
    const query = new URLSearchParams();
    if (selected) query.set('category', selected);
    if (q) query.set('q', q);
    return `/${query.size ? '?' + query.toString() : ''}#products`;
  }
  const store = await db().store.findUnique({ where: { id: 1 } });
  if (!store) return <section className="container narrow empty"><h1>ร้านค้ายังไม่พร้อมใช้งาน</h1><p>เจ้าของร้านโปรดไปที่หน้า <Link href="/setup">ตั้งค่าครั้งแรก</Link></p></section>;
  const [categories, products, bannerSlides] = await Promise.all([
    db().category.findMany({ orderBy: { name: 'asc' } }),
    db().product.findMany({ where: {
      active: true,
      ...(category ? { categoryId: category } : {}),
      ...(q ? { OR: [
        { name: { contains: q, mode: 'insensitive' as const } },
        { description: { contains: q, mode: 'insensitive' as const } },
      ] } : {}),
    }, include: { category: true }, orderBy: { createdAt: 'desc' } }),
    db().bannerSlide.findMany({ where: { active: true }, orderBy: [{ position: 'asc' }, { createdAt: 'asc' }], take: 5 }),
  ]);
  return <>
    <BannerCarousel slides={bannerSlides}/>
    <div className="benefits-strip"><div className="container benefits-inner"><p><span>01</span><strong>เลือกชมสินค้า</strong><small>ดูรายละเอียดก่อนตัดสินใจ</small></p><p><span>02</span><strong>สั่งซื้อออนไลน์</strong><small>กรอกข้อมูลจัดส่งในไม่กี่ขั้นตอน</small></p><p><span>03</span><strong>ตรวจสอบคำสั่งซื้อ</strong><small>ติดตามสถานะผ่านลิงก์คำสั่งซื้อ</small></p></div></div>
    {categories.length > 0 && <section className="container category-section"><div className="section-heading"><div><span className="eyebrow">EXPLORE</span><h2>เลือกตามหมวดหมู่</h2></div></div><div className="category-grid">{categories.map((item, index) => <Link className={category === item.id ? 'category-card active' : 'category-card'} key={item.id} href={categoryHref(item.id)} aria-current={category === item.id ? 'page' : undefined}><span>{String(index + 1).padStart(2, '0')}</span><strong>{item.name}</strong><span className="category-arrow">↗</span></Link>)}</div></section>}
    <section className="container section" id="products"><div className="section-heading"><div><span className="eyebrow">OUR COLLECTION</span><h2>สินค้าทั้งหมด</h2></div><span className="muted">{products.length} รายการ</span></div>
      <form className="product-search" action="/#products" method="get" role="search"><label htmlFor="product-search">ค้นหาสินค้า</label><div className="product-search-controls"><input id="product-search" name="q" type="search" defaultValue={q} maxLength={100} placeholder="ค้นจากชื่อหรือรายละเอียดสินค้า"/>{category && <input type="hidden" name="category" value={category}/>}<button className="button" type="submit">ค้นหา</button>{q && <Link className="product-search-clear" href={category ? `/?category=${encodeURIComponent(category)}#products` : '/#products'}>ล้างคำค้น</Link>}</div></form>
      <div className="chips"><Link className={!category ? 'chip active' : 'chip'} href={categoryHref()}>ทั้งหมด</Link>{categories.map((item) => <Link key={item.id} className={category === item.id ? 'chip active' : 'chip'} href={categoryHref(item.id)}>{item.name}</Link>)}</div>
      {products.length ? <div className="product-grid">{products.map((item) => <article className="product-card" key={item.id}>
        <Link href={'/product/' + item.id} className="product-image">{item.imageKey ? <img src={'/api/media/' + encodeURIComponent(item.imageKey)} alt={item.name}/> : <span>◈</span>}</Link>
        <div className="product-info"><span className="eyebrow">{item.category?.name || 'สินค้า'}</span><Link href={'/product/' + item.id}><h3>{item.name}</h3></Link><p>{baht(item.price)}</p><AddToCart id={item.id} name={item.name} price={item.price} stock={item.stock}/></div>
      </article>)}</div> : <div className="empty">{q ? 'ไม่พบสินค้าที่ตรงกับคำค้นหา' : category ? 'ยังไม่มีสินค้าในหมวดนี้' : 'ยังไม่มีสินค้า'}</div>}
    </section>
    <section className="contact-strip"><div className="container"><h2>ติดต่อร้านค้า</h2><div className="contact-methods"><p className="contact-method"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7l.5 3a2 2 0 0 1-.6 1.7L7.1 10a16 16 0 0 0 6 6l1.6-1.9a2 2 0 0 1 1.7-.6l3 .5a2 2 0 0 1 1.6 1.9Z"/></svg><span>{store.contactPhone || 'เบอร์โทรยังไม่ได้ตั้งค่า'}</span></p>{store.contactLine && <p className="contact-method"><svg viewBox="0 0 32 32" aria-hidden="true"><rect width="32" height="32" rx="7" fill="#06C755"/><path d="M16 5.5C9.4 5.5 4.5 9.9 4.5 15.2c0 4.3 3.3 7.7 7.8 9l-.5 4.3 5-3.8c6.2-.3 10.7-4.3 10.7-9.5C27.5 9.9 22.6 5.5 16 5.5Z" fill="white"/><text x="16" y="18.2" textAnchor="middle" fill="#06C755" fontSize="7" fontWeight="700" fontFamily="Arial,sans-serif">LINE</text></svg><span>LINE: {store.contactLine}</span></p>}</div></div></section>
  </>;
}
