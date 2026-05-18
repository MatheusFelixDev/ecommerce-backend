import { AppError } from '../../../core/errors/app-error';

import type {
  UpdateAdminUserRoleBody,
  UpdateAdminUserRoleParams,
} from '../dtos/update-admin-user-role.dto';
import { mapAdminUser } from '../mappers/admin-user.mapper';
import { adminUsersRepository } from '../repositories/admin-users.repository';

interface UpdateAdminUserRoleServiceRequest
  extends UpdateAdminUserRoleParams,
    UpdateAdminUserRoleBody {
  adminUserId: string;
}

export class UpdateAdminUserRoleService {
  async execute({
    id,
    adminUserId,
    role,
  }: UpdateAdminUserRoleServiceRequest) {
    const user = await adminUsersRepository.findById(id);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND',
      );
    }

    if (
      user.id === adminUserId &&
      user.role === 'ADMIN' &&
      role !== 'ADMIN'
    ) {
      throw new AppError(
        'Admin user cannot remove own admin role.',
        400,
        'USER_CANNOT_CHANGE_OWN_ROLE',
      );
    }

    if (user.role === role) {
      throw new AppError(
        'User already has this role.',
        409,
        'USER_ALREADY_HAS_ROLE',
      );
    }

    const updatedUser = await adminUsersRepository.updateRole(
      user.id,
      role,
    );

    return mapAdminUser(updatedUser);
  }
}

export const updateAdminUserRoleService =
  new UpdateAdminUserRoleService();
