import { ApiProperty } from '@nestjs/swagger';

export class TokenResponseDto {
  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '액세스 토큰',
  })
  accessToken: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '리프레시 토큰',
  })
  refreshToken: string;
}

export class UserProfileResponseDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '사용자 ID',
  })
  id: string;

  nickname: string;

  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  email: string;

  @ApiProperty({
    example: ['user'],
    description: '사용자 역할 목록',
  })
  roles: string[];

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

export class ErrorDetailDto {
  @ApiProperty({
    example: 6,
    description: '에러 코드'
  })
  code: number;

  @ApiProperty({
    example: { code: 'AUTH003', field: 'email' },
    description: '에러 상세 정보'
  })
  details?: Record<string, any>;
}

export class AuthResponseDto {
  @ApiProperty({
    example: true,
    description: '작업 성공 여부',
  })
  success: boolean;

  @ApiProperty({
    example: '성공적으로 처리되었습니다.',
    description: '응답 메시지'
  })
  message: string;

  @ApiProperty({
    description: '응답 데이터',
    type: () => TokenResponseDto,
  })
  data?: TokenResponseDto | UserProfileResponseDto;

  @ApiProperty({
    description: '에러 정보',
    type: () => ErrorDetailDto,
    required: false
  })
  error?: ErrorDetailDto;
} 