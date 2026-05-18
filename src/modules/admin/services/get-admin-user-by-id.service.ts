import { AppError } from '../../../core/errors/app-error';

import type { GetAdminUserByIdParams } from '../dtos/get-admin-user-by-id.dto';
import { mapAdminUser } from '../mappers/admin-user.mapper';
import { adminUsersRepository } from '../repositories/admin-users.repository';

export class GetAdminUserByIdService {
  async execute(params: GetAdminUserByIdParams) {
    const user = await adminUsersRepository.findById(params.id);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND',
      );
    }

    return mapAdminUser(user);
  }
}

export const getAdminUserByIdService =
  new GetAdminUserByIdService();
