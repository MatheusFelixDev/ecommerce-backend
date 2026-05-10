import bcrypt from 'bcrypt';
import { createHash, randomBytes } from 'node:crypto';

import { AppError } from '../../../core/errors/app-error';
import type { LoginUserDto } from '../dtos/login-user.dto';
import type { UserResponseDto } from '../dtos/user-response.dto';
import { mapUserToResponse } from '../mappers/user.mapper';
import { refreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { usersRepository } from '../repositories/users.repository';

const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

type LoginUserServiceResult = {
  user: UserResponseDto;
  refreshToken: string;
};

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

function getRefreshTokenExpirationDate(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

  return expiresAt;
}

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
    const refreshTokenHash = hashToken(refreshToken);

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
