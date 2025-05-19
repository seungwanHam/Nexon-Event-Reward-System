import { IsString, IsEmail } from 'class-validator';

export class LoginRequestDto {
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  @IsString({ message: '비밀번호를 입력해주세요.' })
  password: string;
} 