-- AlterEnum
ALTER TYPE "OrderStatus" ADD VALUE 'SEPARATED';

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "delivered_at" TIMESTAMP(3),
ADD COLUMN     "processing_at" TIMESTAMP(3),
ADD COLUMN     "separated_at" TIMESTAMP(3),
ADD COLUMN     "shipped_at" TIMESTAMP(3),
ADD COLUMN     "tracking_code" TEXT,
ADD COLUMN     "tracking_url" TEXT;
