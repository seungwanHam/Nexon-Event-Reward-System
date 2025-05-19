import { IsString, IsEmail, IsArray, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginRequestDto {
  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '사용자 비밀번호',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;
}

export class RegisterRequestDto {
  @ApiProperty({
    example: 'John Doe',
    description: '사용자 닉네임',
  })
  @IsString()
  @IsNotEmpty()
  nickname: string;

  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'password123',
    description: '사용자 비밀번호',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  password: string;

  @ApiProperty({
    example: ['user'],
    description: '사용자 역할 목록',
  })
  @IsArray()
  @IsString({ each: true })
  roles: string[];
}

export class RefreshTokenRequestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '사용자 ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    description: '리프레시 토큰',
  })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}

export class LogoutRequestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '사용자 ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;
}

export class UpdateUserRequestDto {
  @ApiProperty({
    example: '123e4567-e89b-12d3-a456-426614174000',
    description: '사용자 ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 'John Doe',
    description: '사용자 닉네임',
  })
  @IsString()
  @IsOptional()
  nickname?: string;

  @ApiProperty({
    example: 'user@example.com',
    description: '사용자 이메일',
  })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({
    example: 'password123',
    description: '사용자 비밀번호',
  })
  @IsString()
  @IsOptional()
  @MinLength(8)
  password?: string;

  @ApiProperty({
    example: ['user'],
    description: '사용자 역할 목록',
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  roles?: string[];

  @ApiProperty({
    example: 'active',
    description: '사용자 상태',
  })
  @IsString()
  @IsOptional()
  status?: string;

  @ApiProperty({
    example: { key: 'value' },
    description: '추가 메타데이터',
    required: false,
  })
  @IsOptional()
  metadata?: Record<string, string>;
} 