-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CREDIT_CARD', 'PIX', 'BOLETO');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "coupon_code" TEXT,
ADD COLUMN     "coupon_discount_in_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "payment_method" "PaymentMethod",
ADD COLUMN     "shipping_deadline_days" INTEGER,
ADD COLUMN     "shipping_price_in_cents" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "shipping_provider" TEXT,
ADD COLUMN     "shipping_service_code" TEXT,
ADD COLUMN     "shipping_service_name" TEXT;

-- AlterTable
ALTER TABLE "products" ADD COLUMN     "height_cm" INTEGER,
ADD COLUMN     "length_cm" INTEGER,
ADD COLUMN     "weight_in_grams" INTEGER,
ADD COLUMN     "width_cm" INTEGER;
