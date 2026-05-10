import { AppError } from '../../../core/errors/app-error';
import type { RefreshTokenDto } from '../dtos/refresh-token.dto';
import type { UserResponseDto } from '../dtos/user-response.dto';
import { mapUserToResponse } from '../mappers/user.mapper';
import { refreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { usersRepository } from '../repositories/users.repository';
import {
  generateRefreshToken,
  getRefreshTokenExpirationDate,
  hashRefreshToken,
} from '../utils/refresh-token.utils';

type RefreshTokenServiceResult = {
  user: UserResponseDto;
  refreshToken: string;
};

export class RefreshTokenService {
  async execute(data: RefreshTokenDto): Promise<RefreshTokenServiceResult> {
    const tokenHash = hashRefreshToken(data.refreshToken);

    const storedRefreshToken =
      await refreshTokensRepository.findByTokenHash(tokenHash);

    if (!storedRefreshToken) {
      throw new AppError(
        'Invalid refresh token.',
        401,
        'INVALID_REFRESH_TOKEN',
      );
    }

    if (storedRefreshToken.revokedAt) {
      throw new AppError(
        'Refresh token has been revoked.',
        401,
        'REFRESH_TOKEN_REVOKED',
      );
    }

    if (storedRefreshToken.expiresAt < new Date()) {
      await refreshTokensRepository.revokeById(storedRefreshToken.id);

      throw new AppError(
        'Refresh token has expired.',
        401,
        'REFRESH_TOKEN_EXPIRED',
      );
    }

    const user = await usersRepository.findById(storedRefreshToken.userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    await refreshTokensRepository.revokeById(storedRefreshToken.id);

    const newRefreshToken = generateRefreshToken();

    await refreshTokensRepository.create({
      tokenHash: hashRefreshToken(newRefreshToken),
      userId: user.id,
      expiresAt: getRefreshTokenExpirationDate(),
    });

    return {
      user: mapUserToResponse(user),
      refreshToken: newRefreshToken,
    };
  }
}

export const refreshTokenService = new RefreshTokenService();
