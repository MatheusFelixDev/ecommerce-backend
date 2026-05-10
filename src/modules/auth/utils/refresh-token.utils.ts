import { createHash, randomBytes } from 'node:crypto';

const REFRESH_TOKEN_EXPIRATION_DAYS = 7;

export function generateRefreshToken(): string {
  return randomBytes(64).toString('hex');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

export function getRefreshTokenExpirationDate(): Date {
  const expiresAt = new Date();

  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_EXPIRATION_DAYS);

  return expiresAt;
}
