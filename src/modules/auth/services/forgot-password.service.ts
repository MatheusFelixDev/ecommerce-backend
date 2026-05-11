import { createHash, randomBytes } from 'node:crypto';

import type { ForgotPasswordDto } from '../dtos/forgot-password.dto';
import { passwordResetTokensRepository } from '../repositories/password-reset-tokens.repository';
import { usersRepository } from '../repositories/users.repository';

const PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES = 15;

function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export class ForgotPasswordService {
  async execute(data: ForgotPasswordDto) {
    const user = await usersRepository.findByEmail(data.email);

    if (!user || !user.isActive) {
      return {
        resetToken: null,
      };
    }

    const resetToken = randomBytes(32).toString('hex');
    const tokenHash = hashToken(resetToken);

    const expiresAt = new Date(
      Date.now() +
        PASSWORD_RESET_TOKEN_EXPIRATION_MINUTES * 60 * 1000,
    );

    await passwordResetTokensRepository.create({
      tokenHash,
      userId: user.id,
      expiresAt,
    });

    return {
      resetToken,
    };
  }
}

export const forgotPasswordService =
  new ForgotPasswordService();
