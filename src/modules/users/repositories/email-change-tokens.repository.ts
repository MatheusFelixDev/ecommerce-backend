import type { EmailChangeToken } from '../../../generated/prisma/client';

import { prisma } from '../../../infra/prisma/client';

interface CreateEmailChangeTokenData {
  tokenHash: string;
  userId: string;
  newEmail: string;
  expiresAt: Date;
}

export class EmailChangeTokensRepository {
  async create(
    data: CreateEmailChangeTokenData,
  ): Promise<EmailChangeToken> {
    return prisma.emailChangeToken.create({
      data,
    });
  }

  async findByTokenHash(
    tokenHash: string,
  ): Promise<EmailChangeToken | null> {
    return prisma.emailChangeToken.findUnique({
      where: {
        tokenHash,
      },
    });
  }

  async markAsUsed(id: string): Promise<EmailChangeToken> {
    return prisma.emailChangeToken.update({
      where: {
        id,
      },
      data: {
        usedAt: new Date(),
      },
    });
  }
}

export const emailChangeTokensRepository =
  new EmailChangeTokensRepository();
