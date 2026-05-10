import type { RefreshToken } from '../../../generated/prisma/client';
import { prisma } from '../../../infra/prisma/client';

type CreateRefreshTokenData = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

export class RefreshTokensRepository {
  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }
}

export const refreshTokensRepository = new RefreshTokensRepository();
