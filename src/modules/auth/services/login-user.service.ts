import bcrypt from 'bcrypt';

import { AppError } from '../../../core/errors/app-error';
import type { LoginUserDto } from '../dtos/login-user.dto';
import type { UserResponseDto } from '../dtos/user-response.dto';
import { mapUserToResponse } from '../mappers/user.mapper';
import { refreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { usersRepository } from '../repositories/users.repository';
import {
  generateRefreshToken,
  getRefreshTokenExpirationDate,
  hashRefreshToken,
} from '../utils/refresh-token.utils';

type LoginUserServiceResult = {
  user: UserResponseDto;
  refreshToken: string;
};

export class LoginUserService {
  async execute(data: LoginUserDto): Promise<LoginUserServiceResult> {
    const user = await usersRepository.findByEmail(data.email);

    if (!user) {
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    const passwordMatches = await bcrypt.compare(data.password, user.passwordHash);

    if (!passwordMatches) {
      throw new AppError('Invalid credentials.', 401, 'INVALID_CREDENTIALS');
    }

    const refreshToken = generateRefreshToken();
    const refreshTokenHash = hashRefreshToken(refreshToken);

    await refreshTokensRepository.create({
      tokenHash: refreshTokenHash,
      userId: user.id,
      expiresAt: getRefreshTokenExpirationDate(),
    });

    return {
      user: mapUserToResponse(user),
      refreshToken,
    };
  }
}

export const loginUserService = new LoginUserService();
