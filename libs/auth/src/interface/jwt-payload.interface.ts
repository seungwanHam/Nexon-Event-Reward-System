import { UserRole } from '@app/libs/common/enum';

export interface JwtPayload {
  userId: string;
  email: string;
  roles: UserRole[];
  iat?: number;
  exp?: number;
} 