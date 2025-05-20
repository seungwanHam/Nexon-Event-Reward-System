import { IsNotEmpty, IsString, IsObject, IsISO8601, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * 사용자 이벤트 생성 DTO
 * 
 * 사용자 행동 이벤트(로그인, 회원가입 등)를 기록하기 위한 데이터 전송 객체입니다.
 */
export class CreateUserEventDto {
  /**
   * 사용자 ID
   * 이벤트를 발생시킨 사용자의 고유 식별자입니다.
   */
  @ApiProperty({
    description: '이벤트를 발생시킨 사용자의 고유 식별자',
    example: '507f1f77bcf86cd799439011'
  })
  @IsNotEmpty({ message: '사용자 ID는 필수입니다.' })
  @IsString({ message: '사용자 ID는 문자열이어야 합니다.' })
  userId: string;

  /**
   * 이벤트 타입
   * 발생한 이벤트의 종류를 나타냅니다. (login, register, profile_update, logout 등)
   */
  @ApiProperty({
    description: '이벤트 타입',
    example: 'login',
    enum: ['login', 'register', 'profile_update', 'logout']
  })
  @IsNotEmpty({ message: '이벤트 타입은 필수입니다.' })
  @IsString({ message: '이벤트 타입은 문자열이어야 합니다.' })
  eventType: string;

  /**
   * 이벤트 키
   * 이벤트를 구분하는 고유 키입니다.
   */
  @ApiProperty({
    description: '이벤트 키',
    example: 'user-login'
  })
  @IsNotEmpty({ message: '이벤트 키는 필수입니다.' })
  @IsString({ message: '이벤트 키는 문자열이어야 합니다.' })
  eventKey: string;

  /**
   * 이벤트 발생 시간
   * ISO 8601 형식의 날짜/시간 문자열로 이벤트가 발생한 시간을 나타냅니다.
   */
  @ApiProperty({
    description: '이벤트 발생 시간 (ISO 8601 형식)',
    example: '2023-05-20T14:30:00Z'
  })
  @IsNotEmpty({ message: '이벤트 발생 시간은 필수입니다.' })
  @IsISO8601({}, { message: '이벤트 발생 시간은 ISO 8601 형식이어야 합니다.' })
  occurredAt: string;

  /**
   * 메타데이터
   * 이벤트와 관련된 추가 정보를 포함하는 객체입니다.
   */
  @ApiProperty({
    description: '이벤트 관련 메타데이터',
    example: { deviceInfo: 'Mozilla/5.0...', ipAddress: '192.168.1.1' }
  })
  @IsObject({ message: '메타데이터는 객체여야 합니다.' })
  metadata: Record<string, any>;

  /**
   * 멱등성 키
   * 이벤트의 중복 처리를 방지하기 위한 고유 식별자입니다.
   */
  @ApiProperty({
    description: '이벤트 멱등성 키',
    example: 'user123-login-1621507800000'
  })
  @IsOptional()
  @IsString({ message: '멱등성 키는 문자열이어야 합니다.' })
  idempotencyKey?: string;
} 