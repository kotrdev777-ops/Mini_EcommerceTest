ALTER TABLE "Order" ADD COLUMN "paidAt" TIMESTAMP(3);
UPDATE "Order" SET "paidAt" = "updatedAt" WHERE "status" = 'PAID';
CREATE INDEX "Order_status_paidAt_idx" ON "Order"("status", "paidAt");
