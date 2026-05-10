import type { UserRole } from '../../../generated/prisma/client';

export type UserResponseDto = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};
