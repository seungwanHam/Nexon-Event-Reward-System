import { UserRole, UserStatus } from '@app/libs/common/schema';

export class ProfileResponseDto {
  id: string;
  email: string;
  nickname: string;
  roles: UserRole[];
  status: UserStatus;
  metadata: Record<string, string>;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
} 