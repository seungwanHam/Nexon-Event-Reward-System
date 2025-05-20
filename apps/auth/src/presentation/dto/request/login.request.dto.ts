import { IsString, IsEmail, IsOptional, IsObject } from 'class-validator';

/**
 * 로그인 요청 DTO
 * 
 * 사용자 로그인 시 필요한 데이터를 정의합니다.
 * 이메일과 비밀번호는 필수 항목이며, 디바이스 정보는 선택 항목입니다.
 */
export class LoginRequestDto {
  /**
   * 사용자 이메일
   * 인증에 사용되는 고유 식별자입니다.
   */
  @IsEmail({}, { message: '유효한 이메일 주소를 입력해주세요.' })
  email: string;

  /**
   * 사용자 비밀번호
   * 인증에 사용되는 비밀번호입니다.
   */
  @IsString({ message: '비밀번호를 입력해주세요.' })
  password: string;

  /**
   * 디바이스 정보 (선택 사항)
   * 로그인 시 사용된 디바이스에 대한 정보입니다.
   * 이벤트 기록 및 보안 목적으로 사용됩니다.
   */
  @IsOptional()
  @IsObject()
  deviceInfo?: Record<string, any>;
} 