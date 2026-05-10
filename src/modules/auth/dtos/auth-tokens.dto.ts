import type { UserResponseDto } from './user-response.dto';

export type AuthTokensDto = {
  accessToken: string;
  refreshToken: string;
};

export type AuthResponseDto = {
  user: UserResponseDto;
  tokens: AuthTokensDto;
};
