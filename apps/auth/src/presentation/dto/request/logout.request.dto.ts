import { IsOptional, IsString } from 'class-validator';

export class LogoutRequestDto {
  @IsString({ message: '사용자 ID를 입력해주세요.' })
  userId: string;

  @IsString()
  @IsOptional()
  accessToken?: string;
} 