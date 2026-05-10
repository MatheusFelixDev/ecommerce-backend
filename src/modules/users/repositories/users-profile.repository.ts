import type { Prisma, User } from '../../../generated/prisma/client';
import { prisma } from '../../../infra/prisma/client';

export class UsersProfileRepository {
  async findById(userId: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id: userId,
      },
    });
  }

  async update(userId: string, data: Prisma.UserUpdateInput): Promise<User> {
    return prisma.user.update({
      where: {
        id: userId,
      },
      data,
    });
  }
}

export const usersProfileRepository = new UsersProfileRepository();
