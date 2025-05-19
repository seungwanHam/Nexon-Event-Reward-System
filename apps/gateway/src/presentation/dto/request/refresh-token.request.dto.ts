import { IsString } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString({ message: '사용자 ID를 입력해주세요.' })
  userId: string;

  @IsString()
  refreshToken: string;
} 