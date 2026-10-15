CREATE TABLE "BannerSlide" (
  "id" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 1,
  "imageKey" TEXT,
  "eyebrow" TEXT NOT NULL DEFAULT '',
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "buttonText" TEXT NOT NULL DEFAULT '',
  "link" TEXT NOT NULL DEFAULT '',
  "active" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "BannerSlide_pkey" PRIMARY KEY ("id")
);

INSERT INTO "BannerSlide" ("id", "position", "eyebrow", "title", "description", "buttonText", "link", "createdAt", "updatedAt")
SELECT 'initial-banner', 1, "name", E'เลือกสิ่งที่ใช่\nในแบบของคุณ', COALESCE(NULLIF("description", ''), 'เลือกชมสินค้าจากร้านของเรา'), 'เลือกดูสินค้า ↗', '/#products', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Store" WHERE "id" = 1;
