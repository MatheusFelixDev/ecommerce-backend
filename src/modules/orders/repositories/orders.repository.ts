import { prisma } from '../../../infra/prisma/client';

export class OrdersRepository {
  readonly prisma = prisma;
}

export const ordersRepository = new OrdersRepository();
