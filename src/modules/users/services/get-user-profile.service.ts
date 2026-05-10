import { AppError } from '../../../core/errors/app-error';
import { mapUserProfile } from '../mappers/user-profile.mapper';
import { usersProfileRepository } from '../repositories/users-profile.repository';

export class GetUserProfileService {
  async execute(userId: string) {
    const user = await usersProfileRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    return mapUserProfile(user);
  }
}

export const getUserProfileService = new GetUserProfileService();
