import type {
  Prisma,
  User,
  UserRole,
} from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface ListAdminUsersFilters {
  page: number;
  perPage: number;
  search?: string;
  role?: UserRole;
  isActive?: boolean;
}

interface ListAdminUsersResult {
  users: User[];
  total: number;
}

export class AdminUsersRepository {
  async findMany(
    filters: ListAdminUsersFilters,
  ): Promise<ListAdminUsersResult> {
    const where: Prisma.UserWhereInput = {};

    if (filters.search) {
      where.OR = [
        {
          name: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
        {
          email: {
            contains: filters.search,
            mode: 'insensitive',
          },
        },
      ];
    }

    if (filters.role) {
      where.role = filters.role;
    }

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    const skip = (filters.page - 1) * filters.perPage;

    const [users, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: filters.perPage,
      }),
      prisma.user.count({
        where,
      }),
    ]);

    return {
      users,
      total,
    };
  }

  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: {
        id,
      },
    });
  }

  async updateStatus(
    id: string,
    isActive: boolean,
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        isActive,
      },
    });
  }

  async updateRole(
    id: string,
    role: UserRole,
  ): Promise<User> {
    return prisma.user.update({
      where: {
        id,
      },
      data: {
        role,
      },
    });
  }
}

export const adminUsersRepository =
  new AdminUsersRepository();
