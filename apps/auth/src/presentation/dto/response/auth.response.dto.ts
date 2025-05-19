import { UserRole } from '@app/libs/common/enum';

export class AuthResponseDto {
  id: string;
  email: string;
  nickname: string;
  roles: UserRole[];
  accessToken: string;
  refreshToken: string;
} 