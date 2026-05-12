import { createHash, randomBytes } from 'node:crypto';

import bcrypt from 'bcrypt';

import { AppError } from '../../../core/errors/app-error';
import type { RequestEmailChangeDto } from '../dtos/request-email-change.dto';
import { emailChangeTokensRepository } from '../repositories/email-change-tokens.repository';
import { usersProfileRepository } from '../repositories/users-profile.repository';

const EMAIL_CHANGE_TOKEN_EXPIRATION_MINUTES = 15;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class RequestEmailChangeService {
  async execute(userId: string, data: RequestEmailChangeDto) {
    const user = await usersProfileRepository.findById(userId);

    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    if (!user.isActive) {
      throw new AppError('User is inactive.', 403, 'USER_INACTIVE');
    }

    if (user.email === data.newEmail) {
      throw new AppError(
        'New e-mail must be different from current e-mail.',
        400,
        'EMAIL_NOT_CHANGED',
      );
    }

    const passwordMatches = await bcrypt.compare(
      data.currentPassword,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new AppError(
        'Current password is incorrect.',
        400,
        'INVALID_CURRENT_PASSWORD',
      );
    }

    const emailAlreadyInUse =
      await usersProfileRepository.findByEmail(data.newEmail);

    if (emailAlreadyInUse) {
      throw new AppError(
        'E-mail already registered.',
        409,
        'EMAIL_ALREADY_REGISTERED',
      );
    }

    const emailChangeToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(emailChangeToken);

    const expiresAt = new Date(
      Date.now() +
        EMAIL_CHANGE_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
    );

    await emailChangeTokensRepository.create({
      tokenHash,
      userId: user.id,
      newEmail: data.newEmail,
      expiresAt,
    });

    return {
      emailChangeToken,
    };
  }
}

export const requestEmailChangeService =
  new RequestEmailChangeService();
