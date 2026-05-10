import { AppError } from '../../../core/errors/app-error';
import type { UpdateUserProfileDto } from '../dtos/update-user-profile.dto';
import { mapUserProfile } from '../mappers/user-profile.mapper';
import { usersProfileRepository } from '../repositories/users-profile.repository';

export class UpdateUserProfileService {
  async execute(userId: string, data: UpdateUserProfileDto) {
    const user = await usersProfileRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    const updatedUser = await usersProfileRepository.update(userId, {
      name: data.name,
    });

    return mapUserProfile(updatedUser);
  }
}

export const updateUserProfileService =
  new UpdateUserProfileService();
