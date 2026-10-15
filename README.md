# Mini E-commerce

ร้านค้าออนไลน์ Next.js สำหรับร้านเดียว ใช้ Supabase PostgreSQL และ Cloudflare R2 สำหรับรูปสินค้าและสลิป

## ตั้งค่าและ Deploy

1. สร้าง Supabase project แล้วคัดลอก connection string จาก **Connect**: Transaction pooler สำหรับ `DATABASE_URL` และ Direct connection สำหรับ `DIRECT_URL` (หากระบบที่รัน migration ใช้ IPv6 ไม่ได้ ให้ใช้ Session pooler port 5432 สำหรับ `DIRECT_URL`) เติม `?pgbouncer=true` ใน transaction URL และ URL-encode อักขระพิเศษในรหัสผ่าน
2. สร้าง R2 bucket หนึ่ง bucket และ R2 API token ที่มีสิทธิ์อ่าน/เขียน object ใน bucket นั้น ตั้ง `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` เป็น Environment Variables ฝั่ง server เท่านั้น ห้ามตั้งเป็น `NEXT_PUBLIC_...`
3. ตั้ง CORS ของ R2 bucket ให้ origin ของเว็บอัปโหลดตรงเข้า R2 ได้ ตัวอย่างสำหรับ production (เพิ่ม localhost และ preview origin เฉพาะที่ต้องใช้):

```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "http://127.0.0.1:3000", "https://your-store.example"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

4. Deploy บน Vercel: `vercel.json` เรียก `npm run vercel-build` เพื่อ generate Prisma client, deploy migration และ build แอป ควรใช้ Supabase และ R2 แยกสำหรับ Preview
5. เปิด `/setup` แล้วกรอกรหัสเริ่มต้น `kotrdev7879` เพื่อสร้างร้านและ Admin ครั้งแรก ตั้งค่าทันทีหลัง deploy จากนั้นเพิ่มสินค้าและทดลองแนบสลิป

| Variable | ใช้ทำอะไร |
| --- | --- |
| `DATABASE_URL` | Supabase PostgreSQL transaction pooler สำหรับแอป |
| `DIRECT_URL` | Direct หรือ session pooler สำหรับ Prisma migrations; ถ้าไม่ตั้งจะใช้ `DATABASE_URL` |
| `R2_ACCOUNT_ID` | Cloudflare account ID |
| `R2_ACCESS_KEY_ID` / `R2_SECRET_ACCESS_KEY` | R2 API token credentials |
| `R2_BUCKET_NAME` | ชื่อ bucket ที่เก็บ `products/` และ `slips/` |
| `SESSION_SECRET` | ไม่บังคับ; หากไม่ตั้ง ระบบสร้าง signing key แล้วเก็บใน PostgreSQL |

รูปสินค้าเปิดผ่าน `/api/media/...`; สลิปเปิดได้เมื่อ Admin login และไฟล์ถูกอ้างถึงโดยคำสั่งซื้อแล้วเท่านั้น R2 bucket ไม่จำเป็นต้องเปิด public access อัปโหลดไฟล์สูงสุด 5 MB จาก browser ตรงไป R2 ผ่าน signed URL อายุ 5 นาที

## พัฒนาในเครื่อง

ต้องมี Node.js 22+ คัดลอก `.env.example` ไป `.env.local` แล้วเติมค่าจริง สำหรับ Prisma CLI ให้ export `DATABASE_URL` และ `DIRECT_URL` ใน shell หรือใช้ `.env` ด้วย เนื่องจาก Prisma CLI ไม่โหลด `.env.local` อัตโนมัติ อย่านำ secrets เข้า Git

```bash
npm install
npm run db:migrate
npm run dev
```

## ย้ายข้อมูลจากระบบเดิม

ถ้ามีข้อมูลร้านเดิม ให้ backup/restore PostgreSQL ไป Supabase และคัดลอกไฟล์ Vercel Blob เดิมไป R2 โดยคง object key `products/...` และ `slips/...` เดิม ค่า `imageKey` และ `slipKey` ในฐานข้อมูลอ้าง key เหล่านี้อยู่ อย่าเปลี่ยนเว็บไปฐานข้อมูลใหม่ก่อนย้ายข้อมูลและไฟล์เสร็จ

## ข้อจำกัด

- ชำระเงินด้วยการโอนและตรวจสลิปด้วยคน
- ลูกค้าต้องเก็บลิงก์คำสั่งซื้อไว้; ยังไม่มีบัญชีลูกค้าหรืออีเมลแจ้งเตือน
- ร้านเดียวและ Admin บัญชีเดียวต่อ deployment
- ควรตั้ง backup ให้ Supabase และ R2 ก่อนรับออเดอร์จริง
