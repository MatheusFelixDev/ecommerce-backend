import type { User } from '../../../generated/prisma/client';

import type { UserResponseDto } from '../dtos/user-response.dto';

export function mapUserToResponse(user: User): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
}
