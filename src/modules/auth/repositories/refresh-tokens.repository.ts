import type { RefreshToken } from '../../../generated/prisma/client';
import { prisma } from '../../../infra/prisma/client';

type CreateRefreshTokenData = {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
};

export class RefreshTokensRepository {
  async findByTokenHash(tokenHash: string): Promise<RefreshToken | null> {
    return prisma.refreshToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  async create(data: CreateRefreshTokenData): Promise<RefreshToken> {
    return prisma.refreshToken.create({
      data,
    });
  }

  async revokeById(id: string): Promise<RefreshToken> {
    return prisma.refreshToken.update({
      where: {
        id,
      },
      data: {
        revokedAt: new Date(),
      },
    });
  }
}

export const refreshTokensRepository = new RefreshTokensRepository();
