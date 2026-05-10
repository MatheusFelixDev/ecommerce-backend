import bcrypt from 'bcrypt';

import { AppError } from '../../../core/errors/app-error';
import type { RegisterUserDto } from '../dtos/register-user.dto';
import type { UserResponseDto } from '../dtos/user-response.dto';
import { mapUserToResponse } from '../mappers/user.mapper';
import { usersRepository } from '../repositories/users.repository';

const PASSWORD_SALT_ROUNDS = 10;

export class RegisterUserService {
  async execute(data: RegisterUserDto): Promise<UserResponseDto> {
    const userAlreadyExists = await usersRepository.findByEmail(data.email);

    if (userAlreadyExists) {
      throw new AppError(
        'E-mail already registered.',
        409,
        'EMAIL_ALREADY_REGISTERED',
      );
    }

    const passwordHash = await bcrypt.hash(data.password, PASSWORD_SALT_ROUNDS);

    const user = await usersRepository.create({
      name: data.name,
      email: data.email,
      passwordHash,
    });

    return mapUserToResponse(user);
  }
}

export const registerUserService = new RegisterUserService();
