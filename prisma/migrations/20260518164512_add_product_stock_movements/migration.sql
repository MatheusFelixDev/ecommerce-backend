-- CreateEnum
CREATE TYPE "StockMovementType" AS ENUM ('MANUAL_ADJUSTMENT', 'ORDER_RESERVED', 'ORDER_CANCELED', 'ORDER_SHIPPED', 'RETURN');

-- CreateTable
CREATE TABLE "product_stock_movements" (
    "id" TEXT NOT NULL,
    "product_id" TEXT NOT NULL,
    "admin_user_id" TEXT,
    "type" "StockMovementType" NOT NULL,
    "quantity_change" INTEGER NOT NULL,
    "stock_before" INTEGER NOT NULL,
    "stock_after" INTEGER NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "product_stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "product_stock_movements_product_id_idx" ON "product_stock_movements"("product_id");

-- CreateIndex
CREATE INDEX "product_stock_movements_admin_user_id_idx" ON "product_stock_movements"("admin_user_id");

-- CreateIndex
CREATE INDEX "product_stock_movements_type_idx" ON "product_stock_movements"("type");

-- CreateIndex
CREATE INDEX "product_stock_movements_created_at_idx" ON "product_stock_movements"("created_at");

-- AddForeignKey
ALTER TABLE "product_stock_movements" ADD CONSTRAINT "product_stock_movements_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_stock_movements" ADD CONSTRAINT "product_stock_movements_admin_user_id_fkey" FOREIGN KEY ("admin_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
