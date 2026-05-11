import { createHash } from 'node:crypto';

import bcrypt from 'bcrypt';

import { AppError } from '../../../core/errors/app-error';
import type { ResetPasswordDto } from '../dtos/reset-password.dto';
import { passwordResetTokensRepository } from '../repositories/password-reset-tokens.repository';
import { usersRepository } from '../repositories/users.repository';

const PASSWORD_SALT_ROUNDS = 10;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class ResetPasswordService {
  async execute(data: ResetPasswordDto): Promise<void> {
    const tokenHash = hashToken(data.token);

    const passwordResetToken =
      await passwordResetTokensRepository.findByTokenHash(
        tokenHash,
      );

    if (!passwordResetToken) {
      throw new AppError(
        'Invalid or expired password reset token.',
        400,
        'INVALID_PASSWORD_RESET_TOKEN',
      );
    }

    if (passwordResetToken.usedAt) {
      throw new AppError(
        'Invalid or expired password reset token.',
        400,
        'INVALID_PASSWORD_RESET_TOKEN',
      );
    }

    if (passwordResetToken.expiresAt < new Date()) {
      throw new AppError(
        'Invalid or expired password reset token.',
        400,
        'INVALID_PASSWORD_RESET_TOKEN',
      );
    }

    const user = await usersRepository.findById(
      passwordResetToken.userId,
    );

    if (!user || !user.isActive) {
      throw new AppError(
        'Invalid or expired password reset token.',
        400,
        'INVALID_PASSWORD_RESET_TOKEN',
      );
    }

    const passwordHash = await bcrypt.hash(
      data.newPassword,
      PASSWORD_SALT_ROUNDS,
    );

    await usersRepository.updatePassword(user.id, passwordHash);

    await passwordResetTokensRepository.markAsUsed(
      passwordResetToken.id,
    );
  }
}

export const resetPasswordService =
  new ResetPasswordService();
