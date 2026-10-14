# Mini E-commerce MVP v0.1

ร้านค้าออนไลน์แบบติดตั้งแยกต่อผู้ซื้อหนึ่งราย: หน้าสินค้า, หมวดหมู่, ตะกร้า, Checkout, โอนเงินแนบสลิป, หลังบ้านจัดการสินค้า/คำสั่งซื้อ/ร้านค้า

## เริ่มใช้งานบน Railway

โปรเจกต์ต้องมี **Web Service + PostgreSQL + Storage Bucket** (3 ทรัพยากร) ก่อนนำไปทำ Railway Template

1. สร้าง PostgreSQL และ Storage Bucket ใน Railway project
2. เชื่อม repo นี้เป็น Web Service และตั้งตัวแปรด้านล่างผ่าน Variable References หรือค่าที่สุ่มสร้าง
3. ตั้ง public domain ให้ Web Service และ Deploy; `railway.json` จะรัน migration ก่อนเปิดแอป
4. เปิด `/setup` กรอก `SETUP_SECRET` ที่อยู่ใน Railway Variables, ชื่อร้าน และบัญชี Admin
5. เพิ่มสินค้าใน `/admin/products`, ตั้งบัญชีรับโอนใน `/admin/settings`, ทดลองสั่งซื้อและตรวจสลิปใน `/admin/orders`

| Web variable | ค่า |
| --- | --- |
| `DATABASE_URL` | Reference ไป `Postgres.DATABASE_URL` |
| `SESSION_SECRET` | สุ่มอย่างน้อย 32 ตัวอักษร |
| `SETUP_SECRET` | สุ่มอย่างน้อย 16 ตัวอักษร; ใช้ครั้งแรกเท่านั้น |
| `S3_ENDPOINT` | Reference ไป Bucket `ENDPOINT` |
| `S3_REGION` | Reference ไป Bucket `REGION` |
| `S3_BUCKET` | Reference ไป Bucket `BUCKET` |
| `S3_ACCESS_KEY_ID` | Reference ไป Bucket `ACCESS_KEY_ID` |
| `S3_SECRET_ACCESS_KEY` | Reference ไป Bucket `SECRET_ACCESS_KEY` |

Bucket เป็น private: รูปสินค้าถูกส่งผ่าน `/api/media/...` และสลิปเปิดได้เฉพาะ Admin ที่ล็อกอิน การแสดงรูปจำนวนมากผ่าน Web Service อาจมีค่า bandwidth ของ service

## รันในเครื่องสำหรับผู้พัฒนา

ต้องมี Node.js 22+, PostgreSQL และ S3-compatible bucket (ใช้ bucket ทดสอบแยกจาก production) หากใช้ MinIO ในเครื่อง ให้ตั้ง `S3_FORCE_PATH_STYLE=true`

```bash
npm install
cp .env.example .env
# ตั้งค่าจริงใน .env
npx prisma migrate deploy
npm run dev
```

เปิด `http://localhost:3000/setup` การสร้าง Admin ทำได้เพียงครั้งเดียว

## แก้โค้ดด้วย AI ภายหลัง

เมื่อ Deploy จาก Railway Template ค่าเริ่มต้นจะยังชี้ไป repo ต้นทาง ให้ผู้ซื้อใช้ **Eject** ใน Railway Service → Settings → Source เพื่อสร้าง repo ของตนเองก่อนแก้ด้วย GitHub Codespaces และ AI จากนั้นตรวจว่า Railway Deploy จาก repo ใหม่ Prompt ตัวอย่าง: “แก้เฉพาะหน้า `src/app/page.tsx` และ CSS ที่เกี่ยวข้อง เพิ่มแบนเนอร์ร้าน โดยไม่เปลี่ยน checkout, migrations หรือ env variables; รัน build แล้วสรุปผล”

## ขอบเขตและข้อจำกัดของ v0.1

- ชำระเงินแบบโอนและตรวจสลิปด้วยคน ไม่มี Payment Gateway หรือการตรวจสลิปอัตโนมัติ
- ลูกค้าดูคำสั่งซื้อผ่านลิงก์ URL ที่สุ่มยาวและควรเก็บไว้; ยังไม่มีระบบบัญชีลูกค้า/อีเมลแจ้งเตือน
- รองรับร้านเดียวและ Admin บัญชีเดียวต่อ deployment
- ยังไม่มีระบบค่าจัดส่งตามพื้นที่, คูปอง, ภาษี, การพิมพ์ใบเสร็จ หรือระบบขนส่ง
- ควรตั้ง backup ให้ PostgreSQL และ Bucket ก่อนรับคำสั่งซื้อจริง

## โครงสร้าง

- `src/app` หน้าร้าน, หลังบ้าน, actions และ API routes
- `src/lib` Database, Auth, Storage และฟังก์ชันราคา
- `prisma/schema.prisma` โมเดลข้อมูล
- `prisma/migrations` Migration สำหรับ Railway

## การทดสอบก่อนส่งให้ลูกค้า

1. Deploy ด้วย Railway account ใหม่; ตั้งค่า Admin จาก `/setup`
2. เพิ่มหมวดหมู่และสินค้า พร้อมรูป
3. สั่งซื้อและเช็กว่ายอดถูกต้อง แม้แก้ราคาใน localStorage
4. แนบสลิป ตรวจจาก Admin, ปฏิเสธแล้วแนบใหม่, ยืนยันจ่าย
5. ยกเลิกออเดอร์และตรวจว่าสต็อกกลับมา
6. Eject source แล้วแก้ข้อความเล็กน้อยผ่าน Codespaces และตรวจว่า Railway Deploy จาก repo ของลูกค้า
