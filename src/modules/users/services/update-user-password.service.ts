import bcrypt from 'bcrypt';

import { AppError } from '../../../core/errors/app-error';
import type { UpdateUserPasswordDto } from '../dtos/update-user-password.dto';
import { usersProfileRepository } from '../repositories/users-profile.repository';

const PASSWORD_SALT_ROUNDS = 10;

export class UpdateUserPasswordService {
  async execute(
    userId: string,
    data: UpdateUserPasswordDto,
  ): Promise<void> {
    const user = await usersProfileRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    const passwordMatches = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(
        'Current password is incorrect.',
        400,
        'INVALID_CURRENT_PASSWORD',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.newPassword,
      PASSWORD_SALT_ROUNDS,
    );

    await usersProfileRepository.update(userId, {
      passwordHash,
    });
  }
}

export const updateUserPasswordService =
  new UpdateUserPasswordService();
