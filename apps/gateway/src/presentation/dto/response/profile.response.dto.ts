import { UserRole, UserStatus } from '@app/libs/common/enum';
import { ApiProperty } from '@nestjs/swagger';

export class ProfileResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '사용자 ID',
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  email: string;

  @ApiProperty({
    example: '홍길동',
    description: '사용자 닉네임',
  })
  nickname: string;

  @ApiProperty({
    example: ['user'],
    description: '사용자 권한',
    enum: UserRole,
    isArray: true,
  })
  roles: UserRole[];

  @ApiProperty({
    example: 'ACTIVE',
    description: '사용자 상태',
    enum: UserStatus,
  })
  status: UserStatus;

  @ApiProperty({
    example: { key: 'value' },
    description: '추가 메타데이터',
  })
  metadata: Record<string, string>;

  @ApiProperty({
    example: '2024-03-19T15:00:00.000Z',
    description: '마지막 로그인 시간',
    required: false,
  })
  lastLoginAt?: string;

  @ApiProperty({
    example: '2024-03-19T15:00:00.000Z',
    description: '계정 생성일',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-03-19T15:00:00.000Z',
    description: '계정 수정일',
  })
  updatedAt: string;
} 