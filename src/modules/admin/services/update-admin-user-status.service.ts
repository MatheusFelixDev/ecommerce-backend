import { AppError } from '../../../core/errors/app-error';

import type {
  UpdateAdminUserStatusBody,
  UpdateAdminUserStatusParams,
} from '../dtos/update-admin-user-status.dto';
import { mapAdminUser } from '../mappers/admin-user.mapper';
import { adminUsersRepository } from '../repositories/admin-users.repository';

interface UpdateAdminUserStatusServiceRequest
  extends UpdateAdminUserStatusParams,
    UpdateAdminUserStatusBody {
  adminUserId: string;
}

export class UpdateAdminUserStatusService {
  async execute({
    id,
    adminUserId,
    isActive,
  }: UpdateAdminUserStatusServiceRequest) {
    const user = await adminUsersRepository.findById(id);

    if (!user) {
      throw new AppError(
        'User not found.',
        404,
        'USER_NOT_FOUND',
      );
    }

    if (user.id === adminUserId && !isActive) {
      throw new AppError(
        'Admin user cannot block own account.',
        400,
        'USER_CANNOT_BLOCK_SELF',
      );
    }

    if (user.isActive === isActive) {
      throw new AppError(
        isActive
          ? 'User is already active.'
          : 'User is already blocked.',
        409,
        isActive ? 'USER_ALREADY_ACTIVE' : 'USER_ALREADY_BLOCKED',
      );
    }

    const updatedUser = await adminUsersRepository.updateStatus(
      user.id,
      isActive,
    );

    return mapAdminUser(updatedUser);
  }
}

export const updateAdminUserStatusService =
  new UpdateAdminUserStatusService();
