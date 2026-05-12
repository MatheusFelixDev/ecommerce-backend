import { createHash } from 'node:crypto';

import { AppError } from '../../../core/errors/app-error';
import type { ConfirmEmailChangeDto } from '../dtos/confirm-email-change.dto';
import { emailChangeTokensRepository } from '../repositories/email-change-tokens.repository';
import { usersProfileRepository } from '../repositories/users-profile.repository';

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class ConfirmEmailChangeService {
  async execute(userId: string, data: ConfirmEmailChangeDto) {
    const tokenHash = hashToken(data.token);

    const emailChangeToken =
      await emailChangeTokensRepository.findByTokenHash(
        tokenHash,
      );

    if (!emailChangeToken) {
      throw new AppError(
        'Invalid or expired e-mail change token.',
        400,
        'INVALID_EMAIL_CHANGE_TOKEN',
      );
    }

    if (emailChangeToken.userId !== userId) {
      throw new AppError(
        'Invalid or expired e-mail change token.',
        400,
        'INVALID_EMAIL_CHANGE_TOKEN',
      );
    }

    if (emailChangeToken.usedAt) {
      throw new AppError(
        'Invalid or expired e-mail change token.',
        400,
        'INVALID_EMAIL_CHANGE_TOKEN',
      );
    }

    if (emailChangeToken.expiresAt < new Date()) {
      throw new AppError(
        'Invalid or expired e-mail change token.',
        400,
        'INVALID_EMAIL_CHANGE_TOKEN',
      );
    }

    const emailAlreadyInUse =
      await usersProfileRepository.findByEmail(
        emailChangeToken.newEmail,
      );

    if (
      emailAlreadyInUse &&
      emailAlreadyInUse.id !== userId
    ) {
      throw new AppError(
        'E-mail already registered.',
        409,
        'EMAIL_ALREADY_REGISTERED',
      );
    }

    const updatedUser =
      await usersProfileRepository.updateEmail(
        userId,
        emailChangeToken.newEmail,
      );

    await emailChangeTokensRepository.markAsUsed(
      emailChangeToken.id,
    );

    return updatedUser;
  }
}

export const confirmEmailChangeService =
  new ConfirmEmailChangeService();
