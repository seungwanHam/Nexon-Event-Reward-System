import { IsEmail, IsString, IsOptional, IsArray, MinLength, IsEnum, Matches } from 'class-validator';
import { UserRole } from '@app/libs/common/enum';

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

  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true, message: '유효하지 않은 권한입니다.' })
  roles?: UserRole[] = [UserRole.USER];
} 