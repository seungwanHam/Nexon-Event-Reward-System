import { IsString, IsEmail, IsOptional, MinLength, IsArray, IsEnum, IsObject, Matches } from 'class-validator';
import { UserRole, UserStatus } from '@app/libs/common/schema';

export class UpdateUserRequestDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  @IsOptional()
  email?: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    { message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.' }
  )
  @IsOptional()
  password?: string;

  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  @IsOptional()
  nickname?: string;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[];

  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, string>;
} 