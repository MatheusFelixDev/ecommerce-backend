import type { PasswordResetToken } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreatePasswordResetTokenData {
  tokenHash: string;
  userId: string;
  expiresAt: Date;
}

export class PasswordResetTokensRepository {
  async create(
    data: CreatePasswordResetTokenData,
  ): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.create({
      data,
    });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<PasswordResetToken | null> {
    return prisma.passwordResetToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  async markAsUsed(id: string): Promise<PasswordResetToken> {
    return prisma.passwordResetToken.update({
      where: {
        id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}

export const passwordResetTokensRepository =
  new PasswordResetTokensRepository();
