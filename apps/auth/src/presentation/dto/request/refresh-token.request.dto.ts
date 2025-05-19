import { IsString } from 'class-validator';

export class RefreshTokenRequestDto {
  @IsString({ message: '사용자 ID를 입력해주세요.' })
  userId: string;

  @IsString({ message: '리프레시 토큰을 입력해주세요.' })
  refreshToken: string;
} 