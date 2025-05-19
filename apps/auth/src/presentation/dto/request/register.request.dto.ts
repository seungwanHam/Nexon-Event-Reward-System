import { IsString, IsEmail, IsOptional, MinLength, IsArray, IsEnum, Matches } from 'class-validator';
import { UserRole } from '@app/libs/common/schema';

export class RegisterRequestDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString()
  @MinLength(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' })
  @Matches(
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/,
    { message: '비밀번호는 영문, 숫자, 특수문자를 포함해야 합니다.' }
  )
  password: string;

  @IsString()
  @MinLength(2, { message: '닉네임은 최소 2자 이상이어야 합니다.' })
  nickname: string;

  @IsArray()
  @IsEnum(UserRole, { each: true })
  @IsOptional()
  roles?: UserRole[] = [UserRole.USER];
} 