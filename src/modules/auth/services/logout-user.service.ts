import type { LogoutUserDto } from '../dtos/logout-user.dto';
import { refreshTokensRepository } from '../repositories/refresh-tokens.repository';
import { hashRefreshToken } from '../utils/refresh-token.utils';

export class LogoutUserService {
  async execute(data: LogoutUserDto): Promise<void> {
    const tokenHash = hashRefreshToken(data.refreshToken);

    const storedRefreshToken =
      await refreshTokensRepository.findByTokenHash(tokenHash);

    if (!storedRefreshToken) {
      return;
    }

    if (storedRefreshToken.revokedAt) {
      return;
    }

    await refreshTokensRepository.revokeById(storedRefreshToken.id);
  }
}

export const logoutUserService = new LogoutUserService();
