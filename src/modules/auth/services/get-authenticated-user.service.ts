import { AppError } from '../../../core/errors/app-error';
import type { UserResponseDto } from '../dtos/user-response.dto';
import { mapUserToResponse } from '../mappers/user.mapper';
import { usersRepository } from '../repositories/users.repository';

export class GetAuthenticatedUserService {
  async execute(userId: string): Promise<UserResponseDto> {
    const user = await usersRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    return mapUserToResponse(user);
  }
}

export const getAuthenticatedUserService = new GetAuthenticatedUserService();
