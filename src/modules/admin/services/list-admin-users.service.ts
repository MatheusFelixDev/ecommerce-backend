import type { ListAdminUsersQuery } from '../dtos/list-admin-users.dto';
import { mapAdminUser } from '../mappers/admin-user.mapper';
import { adminUsersRepository } from '../repositories/admin-users.repository';

export class ListAdminUsersService {
  async execute(filters: ListAdminUsersQuery) {
    const { users, total } = await adminUsersRepository.findMany({
      page: filters.page,
      perPage: filters.perPage,
      search: filters.search,
      role: filters.role,
      isActive: filters.isActive,
    });

    return {
      users: users.map(mapAdminUser),
      meta: {
        page: filters.page,
        perPage: filters.perPage,
        total,
        totalPages: Math.ceil(total / filters.perPage),
      },
    };
  }
}

export const listAdminUsersService =
  new ListAdminUsersService();
