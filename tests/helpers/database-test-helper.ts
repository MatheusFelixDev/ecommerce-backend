import { prisma } from '../../src/infra/prisma/client';

function assertTestDatabase(): void {
  const databaseUrl = process.env.DATABASE_URL || '';

  const isTestEnvironment = process.env.NODE_ENV === 'test';
  const isTestDatabase = databaseUrl.includes('test');

  if (!isTestEnvironment || !isTestDatabase) {
    throw new Error(
      'Refusing to clear database outside test environment.',
    );
  }
}

export async function clearDatabase(): Promise<void> {
  assertTestDatabase();

  await prisma.productStockMovement.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.cartItem.deleteMany();
  await prisma.productImage.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.address.deleteMany();
  await prisma.emailChangeToken.deleteMany();
  await prisma.passwordResetToken.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();
  await prisma.healthCheck.deleteMany();
}

export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
}
