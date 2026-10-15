CREATE TABLE "ShippingMethod" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "price" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShippingMethod_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShippingMethod_name_key" ON "ShippingMethod"("name");

ALTER TABLE "Order" ADD COLUMN "shippingMethodName" TEXT NOT NULL DEFAULT '';

INSERT INTO "ShippingMethod" ("id", "name", "price", "active", "createdAt", "updatedAt")
SELECT 'default-shipping', 'จัดส่งมาตรฐาน', "shippingFee", true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
FROM "Store"
WHERE "id" = 1;
