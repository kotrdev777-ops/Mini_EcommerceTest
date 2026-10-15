'use server';

import { db } from '@/lib/db';
import { requireAdmin, signIn, signOut } from '@/lib/auth';
import { priceFromInput } from '@/lib/format';
import { verifiedImage } from '@/lib/storage';
import bcrypt from 'bcryptjs';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

function text(form: FormData, key: string, max = 200) {
  return String(form.get(key) ?? '').trim().slice(0, max);
}

function positiveInt(value: string, name: string) {
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < 0 || number > 2_000_000_000) throw new Error(name + ' ไม่ถูกต้อง');
  return number;
}

export async function setup(form: FormData) {
  const expected = 'kotrdev7879';
  const given = form.get('starterPassword');
  if (typeof given !== 'string') throw new Error('รหัสติดตั้งไม่ถูกต้อง');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) throw new Error('รหัสติดตั้งไม่ถูกต้อง');
  const email = text(form, 'email').toLowerCase();
  const password = text(form, 'password', 200);
  const name = text(form, 'name');
  const bankName = text(form, 'bankName');
  const bankAccountName = text(form, 'bankAccountName');
  const bankAccountNumber = text(form, 'bankAccountNumber');
  if (!/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !name) throw new Error('กรอกอีเมล ชื่อร้าน และรหัสผ่านอย่างน้อย 8 ตัวอักษร');
  if (!bankName || !bankAccountName || !bankAccountNumber) throw new Error('ต้องกรอกบัญชีรับโอนเงินให้ครบ');
  if (await db().admin.count()) redirect('/admin/login');
  const passwordHash = await bcrypt.hash(password, 12);
  const admin = await db().$transaction(async (tx) => {
    await tx.store.create({ data: {
      id: 1, name, description: '',
      sessionKey: randomBytes(32).toString('base64url'),
      bankName, bankAccountName, bankAccountNumber,
    } });
    await tx.shippingMethod.create({ data: { name: 'จัดส่งมาตรฐาน', price: 0 } });
    await tx.bannerSlide.create({ data: {
      position: 1, eyebrow: name, title: 'เลือกสิ่งที่ใช่\nในแบบของคุณ',
      description: 'เลือกชมสินค้าจากร้านของเรา', buttonText: 'เลือกดูสินค้า ↗', link: '/#products',
    } });
    return tx.admin.create({ data: { email, passwordHash } });
  });
  await signIn(admin.id);
  redirect('/admin');
}

export async function login(form: FormData) {
  const email = text(form, 'email').toLowerCase();
  const admin = await db().admin.findUnique({ where: { email } });
  if (!admin || !await bcrypt.compare(text(form, 'password', 200), admin.passwordHash)) {
    redirect('/admin/login?error=1');
  }
  await signIn(admin.id);
  redirect('/admin');
}

export async function logout() {
  await signOut();
  redirect('/');
}

export async function saveStore(form: FormData) {
  await requireAdmin();
  const name = text(form, 'name');
  if (!name) throw new Error('ต้องระบุชื่อร้าน');
  if (!text(form, 'bankName') || !text(form, 'bankAccountName') || !text(form, 'bankAccountNumber')) throw new Error('ต้องกรอกบัญชีรับโอนเงินให้ครบ');
  await db().store.update({ where: { id: 1 }, data: {
    name, description: text(form, 'description', 1000),
    contactPhone: text(form, 'contactPhone', 100),
    contactLine: text(form, 'contactLine', 100),
    bankName: text(form, 'bankName', 100),
    bankAccountName: text(form, 'bankAccountName', 100),
    bankAccountNumber: text(form, 'bankAccountNumber', 100),
  } });
  revalidatePath('/');
  revalidatePath('/admin/settings');
  redirect('/admin/settings?saved=1');
}

function bannerLink(value: string) {
  if (!value) return '';
  if (value.startsWith('/') && !value.startsWith('//') && !/[\\\x00-\x1f]/.test(value)) return value;
  try {
    const url = new URL(value);
    if (url.protocol === 'https:' || url.protocol === 'http:') return url.toString();
  } catch { /* Invalid URL. */ }
  throw new Error('ลิงก์ต้องเป็น path ภายในเว็บ หรือ URL http/https');
}

export async function saveBannerSlide(form: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const id = text(form, 'id');
  const title = text(form, 'title', 200);
  const imageKey = text(form, 'imageKey', 100);
  const position = Number(text(form, 'position'));
  if (!title) return { error: 'กรุณาระบุหัวข้อ banner' };
  if (!Number.isInteger(position) || position < 1 || position > 5) return { error: 'ลำดับสไลด์ต้องอยู่ระหว่าง 1–5' };
  let link: string;
  try {
    link = bannerLink(text(form, 'link', 1000));
    if (imageKey) await verifiedImage(imageKey, 'banners');
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'ข้อมูล banner ไม่ถูกต้อง' };
  }
  try {
    await db().$transaction(async (tx) => {
      await tx.$queryRaw`SELECT pg_advisory_xact_lock(481527)`;
      if (id) {
        const current = await tx.bannerSlide.findUnique({ where: { id } });
        if (!current) throw new Error('ไม่พบสไลด์ กรุณาโหลดหน้าใหม่');
        await tx.bannerSlide.update({ where: { id }, data: {
          position, eyebrow: text(form, 'eyebrow', 100), title,
          description: text(form, 'description', 500), buttonText: text(form, 'buttonText', 100), link,
          active: form.get('active') === 'on', ...(imageKey ? { imageKey } : {}),
        } });
      } else {
        if (!imageKey) throw new Error('กรุณาเลือกรูป banner');
        if (await tx.bannerSlide.count() >= 5) throw new Error('เพิ่มได้สูงสุด 5 สไลด์');
        await tx.bannerSlide.create({ data: {
          position, imageKey, eyebrow: text(form, 'eyebrow', 100), title,
          description: text(form, 'description', 500), buttonText: text(form, 'buttonText', 100), link,
          active: form.get('active') === 'on',
        } });
      }
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'บันทึก banner ไม่สำเร็จ' };
  }
  revalidatePath('/');
  revalidatePath('/admin/settings');
  return {};
}

export async function deleteBannerSlide(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!id) return { error: 'ไม่พบสไลด์' };
  await db().bannerSlide.deleteMany({ where: { id } });
  revalidatePath('/');
  revalidatePath('/admin/settings');
  return {};
}

function isUniqueConstraintError(error: unknown) {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
}

export async function saveCategory(form: FormData) {
  await requireAdmin();
  const id = text(form, 'id');
  const name = text(form, 'name', 100);
  if (!name) redirect('/admin/categories?error=name');
  try {
    if (id) {
      const updated = await db().category.updateMany({ where: { id }, data: { name } });
      if (!updated.count) redirect('/admin/categories?error=missing');
    } else {
      await db().category.create({ data: { name } });
    }
  } catch (error) {
    if (isUniqueConstraintError(error)) redirect('/admin/categories?error=duplicate');
    throw error;
  }
  revalidatePath('/');
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');
  redirect('/admin/categories?saved=1');
}

export async function deleteCategory(form: FormData) {
  await requireAdmin();
  const id = text(form, 'id');
  if (!id) redirect('/admin/categories?error=missing');
  const deleted = await db().category.deleteMany({ where: { id, products: { none: {} } } });
  if (!deleted.count) redirect('/admin/categories?error=not-empty');
  revalidatePath('/');
  revalidatePath('/admin/products');
  revalidatePath('/admin/categories');
  redirect('/admin/categories?deleted=1');
}

export async function saveProduct(form: FormData) {
  let stage = 'authorization';
  try {
    await requireAdmin();
    stage = 'validation';
    const id = text(form, 'id');
    const name = text(form, 'name');
    if (!name) throw new Error('ต้องระบุชื่อสินค้า');
    const imageKey = text(form, 'imageKey', 100) || undefined;
    if (imageKey) {
      stage = 'image';
      await verifiedImage(imageKey, 'products');
    }
    stage = 'fields';
    const categoryId = text(form, 'categoryId');
    const data = {
      name,
      description: text(form, 'description', 3000),
      price: priceFromInput(form.get('price')),
      stock: positiveInt(text(form, 'stock'), 'จำนวนสินค้า'),
      active: form.get('active') === 'on',
      categoryId: categoryId || null,
      ...(imageKey ? { imageKey } : {}),
    };
    stage = 'database';
    if (id) await db().product.update({ where: { id }, data });
    else await db().product.create({ data });
    revalidatePath('/');
    revalidatePath('/admin/products');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[product-save]', {
      stage,
      name: error instanceof Error ? error.name : 'UnknownError',
      message: message.replace(/postgres(?:ql)?:\/\/\S+/gi, '[database URL]'),
    });
    throw error;
  }
}

export async function deleteProduct(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!id) return { error: 'ไม่พบสินค้า กรุณาโหลดหน้าใหม่' };
  const deleted = await db().product.deleteMany({ where: { id, orderItems: { none: {} } } });
  if (!deleted.count) return { error: 'ลบไม่ได้หากสินค้านี้มีประวัติคำสั่งซื้อ กรุณาซ่อนสินค้าแทน' };
  revalidatePath('/');
  revalidatePath('/admin/products');
  return {};
}

class ShippingError extends Error {}

export async function saveShippingMethod(form: FormData): Promise<{ error?: string }> {
  await requireAdmin();
  const id = text(form, 'id');
  const name = text(form, 'name', 100);
  const active = form.get('active') === 'on';
  if (!name) return { error: 'กรุณาระบุชื่อวิธีจัดส่ง' };
  let price: number;
  try {
    price = priceFromInput(form.get('price'));
  } catch {
    return { error: 'กรุณาระบุราคาจัดส่งที่ถูกต้อง' };
  }
  try {
    await db().$transaction(async (tx) => {
      if (id) {
        const current = await tx.shippingMethod.findUnique({ where: { id } });
        if (!current) throw new ShippingError('ไม่พบวิธีจัดส่ง กรุณาโหลดหน้าใหม่');
        if (current.active && !active && await tx.shippingMethod.count({ where: { active: true } }) <= 1) {
          throw new ShippingError('ต้องมีวิธีจัดส่งที่เปิดใช้งานอย่างน้อยหนึ่งแบบ');
        }
        await tx.shippingMethod.update({ where: { id }, data: { name, price, active } });
      } else {
        if (!active && await tx.shippingMethod.count() === 0) throw new ShippingError('วิธีจัดส่งแรกต้องเปิดใช้งาน');
        await tx.shippingMethod.create({ data: { name, price, active } });
      }
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) return { error: 'มีวิธีจัดส่งชื่อนี้แล้ว' };
    if (error instanceof ShippingError) return { error: error.message };
    throw error;
  }
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/admin/shipping');
  return {};
}

export async function deleteShippingMethod(id: string): Promise<{ error?: string }> {
  await requireAdmin();
  if (!id) return { error: 'ไม่พบวิธีจัดส่ง กรุณาโหลดหน้าใหม่' };
  try {
    await db().$transaction(async (tx) => {
      const method = await tx.shippingMethod.findUnique({ where: { id } });
      if (!method) throw new ShippingError('ไม่พบวิธีจัดส่ง กรุณาโหลดหน้าใหม่');
      if (method.active && await tx.shippingMethod.count({ where: { active: true } }) <= 1) {
        throw new ShippingError('ต้องมีวิธีจัดส่งที่เปิดใช้งานอย่างน้อยหนึ่งแบบ');
      }
      await tx.shippingMethod.delete({ where: { id } });
    });
  } catch (error) {
    if (error instanceof ShippingError) return { error: error.message };
    throw error;
  }
  revalidatePath('/cart');
  revalidatePath('/checkout');
  revalidatePath('/admin/shipping');
  return {};
}

export async function setOrderStatus(form: FormData) {
  await requireAdmin();
  const id = text(form, 'id');
  const status = text(form, 'status');
  if (!['PAID', 'REJECTED', 'CANCELLED'].includes(status)) throw new Error('สถานะไม่ถูกต้อง');
  await db().$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id }, include: { items: true } });
    if (!order) throw new Error('ไม่พบคำสั่งซื้อ');
    if (status === 'PAID' && order.status !== 'PENDING_REVIEW') throw new Error('ต้องมีสลิปรอตรวจก่อนยืนยัน');
    if (status === 'REJECTED' && order.status !== 'PENDING_REVIEW') throw new Error('สถานะปัจจุบันไม่สามารถปฏิเสธสลิป');
    if (status === 'CANCELLED' && !['AWAITING_SLIP', 'PENDING_REVIEW', 'REJECTED'].includes(order.status)) throw new Error('ไม่สามารถยกเลิกคำสั่งซื้อนี้');
    const changed = await tx.order.updateMany({ where: { id, status: order.status }, data: { status: status as 'PAID' | 'REJECTED' | 'CANCELLED', ...(status === 'PAID' ? { paidAt: new Date() } : {}) } });
    if (changed.count !== 1) throw new Error('สถานะเปลี่ยนไปแล้ว กรุณาโหลดหน้าใหม่');
    if (status === 'CANCELLED') {
      for (const item of order.items) if (item.productId) await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.quantity } } });
    }
  });
  revalidatePath('/admin/orders');
  revalidatePath('/admin');
  revalidatePath('/');
}

type OrderState = { error?: string; code?: string };
class CheckoutError extends Error {}

export async function createOrder(_: OrderState, form: FormData): Promise<OrderState> {
  try {
    const cart = JSON.parse(text(form, 'cart', 10000)) as Array<{ id: string; quantity: number }>;
    if (!Array.isArray(cart) || cart.length === 0 || cart.length > 50) throw new CheckoutError('ตะกร้าสินค้าไม่ถูกต้อง');
    const counts = new Map<string, number>();
    for (const item of cart) {
      if (typeof item.id !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 100) throw new CheckoutError('จำนวนสินค้าไม่ถูกต้อง');
      counts.set(item.id, (counts.get(item.id) || 0) + item.quantity);
    }
    const customerName = text(form, 'customerName');
    const customerEmail = text(form, 'customerEmail');
    const customerPhone = text(form, 'customerPhone');
    const address = text(form, 'address', 1000);
    const shippingMethodId = text(form, 'shippingMethodId');
    if (!customerName || !/^\S+@\S+\.\S+$/.test(customerEmail) || !customerPhone || !address) throw new CheckoutError('กรอกข้อมูลจัดส่งให้ครบ');
    const code = randomBytes(16).toString('hex');
    await db().$transaction(async (tx) => {
      const shippingMethod = await tx.shippingMethod.findUnique({ where: { id: shippingMethodId } });
      if (!shippingMethod?.active) throw new CheckoutError('วิธีจัดส่งไม่พร้อมใช้งาน กรุณาเลือกใหม่');
      const products = await tx.product.findMany({ where: { id: { in: [...counts.keys()] }, active: true } });
      if (products.length !== counts.size) throw new CheckoutError('มีสินค้าที่ไม่พร้อมขาย');
      for (const product of products) {
        const quantity = counts.get(product.id)!;
        const updated = await tx.product.updateMany({ where: { id: product.id, active: true, stock: { gte: quantity } }, data: { stock: { decrement: quantity } } });
        if (updated.count !== 1) throw new CheckoutError('สินค้า ' + product.name + ' มีจำนวนไม่พอ');
      }
      const subtotal = products.reduce((sum, product) => sum + product.price * counts.get(product.id)!, 0);
      if (subtotal + shippingMethod.price > 2_000_000_000) throw new CheckoutError('ยอดคำสั่งซื้อเกินขอบเขตที่รองรับ');
      await tx.order.create({ data: {
        code, customerName, customerEmail, customerPhone, address,
        note: text(form, 'note', 1000), subtotal,
        shippingMethodName: shippingMethod.name, shippingFee: shippingMethod.price,
        total: subtotal + shippingMethod.price,
        items: { create: products.map((product) => ({ productId: product.id, name: product.name, quantity: counts.get(product.id)!, unitPrice: product.price })) },
      } });
    });
    revalidatePath('/');
    return { code };
  } catch (error) {
    return { error: error instanceof CheckoutError ? error.message : 'สร้างคำสั่งซื้อไม่สำเร็จ กรุณาลองอีกครั้ง' };
  }
}
