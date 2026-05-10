import type { User } from '../../../generated/prisma/client';
import { prisma } from '../../../infra/prisma/client';

type CreateUserData = {
  name: string;
  email: string;
  passwordHash: string;
};

export class UsersRepository {
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        email,
      },
    });
  }

  async create(data: CreateUserData): Promise<User> {
    return prisma.user.create({
      data,
    });
  }
}

export const usersRepository = new UsersRepository();
