import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

// DTO
import {
  RegisterRequestDto,
  RefreshTokenRequestDto,
  LoginRequestDto,
  LogoutRequestDto,
  UpdateUserRequestDto,
  AuthResponseDto,
  TokenResponseDto,
  ProfileResponseDto
} from '../../presentation/dto';

// Service
import { AuthService } from '../../domain/service/auth.service';
import { UserService } from '../../domain/service/user.service';

/**
 * Auth 파사드 클래스
 * 
 * Auth 서비스의 핵심 기능들을 외부에 노출하는 퍼사드 패턴 구현 클래스입니다.
 * 컨트롤러와 도메인 서비스 사이의 중간 계층으로, 복잡한 비즈니스 로직을 단순화하여 제공합니다.
 * 
 * 주요 책임:
 * 1. 프레젠테이션 계층(컨트롤러)과 도메인 계층(서비스) 사이의 중간 계층 역할
 * 2. 여러 도메인 서비스를 조합하여 복잡한 비즈니스 로직 처리
 * 3. 이벤트 서비스와 통합하여 사용자 행동을 이벤트로 기록
 * 4. 로깅, 예외 처리 등 공통 기능 제공
 */
@Injectable()
export class AuthFacade {
  private readonly logger = new Logger(AuthFacade.name);
  private readonly eventServiceUrl: string;

  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    // 이벤트 서비스 URL 설정
    const eventServiceUrl = this.configService.get<string>('EVENT_SERVICE_URL');
    this.eventServiceUrl = eventServiceUrl || 'http://localhost:3002';
    
    this.logger.debug(`이벤트 서비스 URL 설정: ${this.eventServiceUrl}`);
  }

  /**
   * 회원가입 처리
   * 
   * 새로운 사용자를 시스템에 등록하고 인증 토큰을 발급합니다.
   * 회원가입 성공 시 'register' 이벤트를 기록합니다.
   * 
   * @param registerDto - 사용자 등록 정보가 담긴 DTO
   * @returns 생성된 사용자 정보와 인증 토큰
   */
  async register(registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    this.logger.debug(`회원가입 요청 처리: ${registerDto.email}`);
    
    // 사용자 등록 수행
    const authResponse = await this.authService.register(registerDto);
    
    // 회원가입 이벤트 기록
    await this.recordUserEvent({
      userId: authResponse.id,
      eventType: 'register',
      metadata: {
        email: registerDto.email,
        nickname: registerDto.nickname,
      }
    });
    
    return authResponse;
  }

  /**
   * 로그인 처리
   * 
   * 사용자 인증 정보를 검증하고 인증 토큰을 발급합니다.
   * 로그인 성공 시 'login' 이벤트를 기록합니다.
   * 
   * @param loginDto - 로그인 정보가 담긴 DTO
   * @returns 사용자 정보와 인증 토큰
   */
  async login(loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    this.logger.debug(`로그인 요청 처리: ${loginDto.email}`);
    
    // 로그인 수행
    const authResponse = await this.authService.login(loginDto);
    
    // 로그인 이벤트 기록
    await this.recordUserEvent({
      userId: authResponse.id,
      eventType: 'login',
      metadata: {
        email: loginDto.email,
        deviceInfo: loginDto.deviceInfo || 'unknown',
      }
    });
    
    return authResponse;
  }

  /**
   * 토큰 갱신
   * 
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.
   * 
   * @param refreshTokenDto - 리프레시 토큰 정보가 담긴 DTO
   * @returns 새로 발급된 액세스 토큰과 리프레시 토큰
   */
  async refreshTokens(refreshTokenDto: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    this.logger.debug(`토큰 갱신 요청 처리: ${refreshTokenDto.userId}`);
    return this.authService.refreshTokens(refreshTokenDto);
  }

  /**
   * 로그아웃
   * 
   * 사용자의 리프레시 토큰을 무효화하고 액세스 토큰을 블랙리스트에 추가합니다.
   * 로그아웃 시 'logout' 이벤트를 기록합니다.
   * 
   * @param dto - 로그아웃 정보가 담긴 DTO
   */
  async logout(dto: LogoutRequestDto): Promise<void> {
    this.logger.debug(`로그아웃 요청 처리: ${dto.userId}`);
    
    // 로그아웃 수행
    await this.authService.logout({ ...dto });
    
    // 로그아웃 이벤트 기록
    await this.recordUserEvent({
      userId: dto.userId,
      eventType: 'logout',
      metadata: {}
    });
  }

  /**
   * 프로필 조회
   * 
   * 사용자 ID를 기반으로 프로필 정보를 조회합니다.
   * 
   * @param userId - 조회할 사용자 ID
   * @returns 사용자 프로필 정보
   */
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    this.logger.debug(`프로필 조회 요청 처리: ${userId}`);
    return this.userService.getUserProfile(userId);
  }

  /**
   * 사용자 정보 업데이트
   * 
   * 사용자 정보를 업데이트하고 새로운 인증 토큰을 발급합니다.
   * 정보 업데이트 시 'profile_update' 이벤트를 기록합니다.
   * 
   * @param userId - 업데이트할 사용자 ID
   * @param updateUserDto - 업데이트할 정보가 담긴 DTO
   * @returns 업데이트된 사용자 정보와 인증 토큰
   */
  async updateUser(userId: string, updateUserDto: UpdateUserRequestDto): Promise<AuthResponseDto> {
    this.logger.debug(`사용자 정보 업데이트 요청 처리: ${userId}`);
    
    // 사용자 정보 업데이트 수행
    const authResponse = await this.authService.updateUser(userId, updateUserDto);
    
    // 프로필 업데이트 이벤트 기록
    await this.recordUserEvent({
      userId: userId,
      eventType: 'profile_update',
      metadata: {
        updatedFields: Object.keys(updateUserDto)
      }
    });
    
    return authResponse;
  }

  /**
   * 토큰 검증
   * 
   * JWT 토큰의 유효성을 검사하고 페이로드를 반환합니다.
   * 
   * @param token - 검증할 JWT 토큰
   * @param isRefreshToken - 리프레시 토큰 여부
   * @returns 토큰의 페이로드
   */
  async validateToken(token: string, isRefreshToken = false): Promise<any> {
    return this.authService.validateToken(token, isRefreshToken);
  }

  /**
   * 모든 사용자 조회
   * 
   * 시스템에 등록된 모든 사용자 목록을 조회합니다.
   * 관리자용 기능입니다.
   * 
   * @returns 사용자 프로필 목록
   */
  async getAllUsers(): Promise<ProfileResponseDto[]> {
    this.logger.debug('모든 사용자 목록 조회 요청');
    const users = await this.userService.findAllUsers();
    return users.map(user => ({
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      roles: user.roles,
      status: user.status,
      metadata: user.metadata,
      lastLoginAt: user.lastLoginAt?.toISOString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    }));
  }

  /**
   * 사용자 행동 이벤트 기록
   * 
   * 사용자의 행동을 이벤트 서비스에 기록합니다.
   * 로그인, 회원가입, 프로필 업데이트 등의 행동이 이벤트로 기록됩니다.
   * 
   * @param eventData - 기록할 이벤트 데이터
   * @private
   */
  private async recordUserEvent(eventData: {
    userId: string;
    eventType: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      // 이벤트 타입을 스키마에 정의된 유효한 타입으로 매핑
      const mappedEventType = this.mapToValidEventType(eventData.eventType);
      
      // 이벤트 타입에 대응하는 이벤트 키 생성
      const eventKeyMap: Record<string, string> = {
        'login': 'user-login',
        'register': 'user-register',
        'logout': 'user-logout',
        'profile_update': 'user-profile_update'
      };
      
      const eventKey = eventKeyMap[eventData.eventType] || `user-${eventData.eventType}`;
      
      // 이벤트 데이터 준비
      const payload = {
        userId: eventData.userId,
        eventType: mappedEventType,
        eventKey: eventKey,
        occurredAt: new Date().toISOString(),
        metadata: eventData.metadata,
        idempotencyKey: `${eventData.userId}-${eventData.eventType}-${Date.now()}`,
      };

      this.logger.debug(`사용자 이벤트 기록 시도: ${mappedEventType} (${eventKey}) for ${eventData.userId}`);
      
      // 이벤트 서비스 API 호출
      await firstValueFrom(
        this.httpService.post(`${this.eventServiceUrl}/api/v1/user-events`, payload)
      );
      
      this.logger.debug(`사용자 이벤트 기록 성공: ${mappedEventType} (${eventKey}) for ${eventData.userId}`);
    } catch (error) {
      // 이벤트 기록 실패해도 주요 기능에는 영향 없도록 처리
      this.logger.error(
        `사용자 이벤트 기록 실패: ${eventData.eventType} for ${eventData.userId}, 오류: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * 이벤트 타입을 스키마에 정의된 유효한 타입으로 매핑
   * 
   * @param eventType - 원본 이벤트 타입
   * @returns 매핑된 이벤트 타입
   * @private
   */
  private mapToValidEventType(eventType: string): string {
    // 이벤트 타입 매핑 테이블 (libs/common/src/schema/user-event.schema.ts의 EventType enum과 일치)
    const eventTypeMap: Record<string, string> = {
      'login': 'login',      // EventType.LOGIN
      'register': 'custom',  // EventType.CUSTOM
      'logout': 'custom',    // EventType.CUSTOM
      'profile_update': 'custom', // EventType.CUSTOM
      'purchase': 'custom',  // EventType.CUSTOM
      'game_start': 'custom' // EventType.CUSTOM
    };

    return eventTypeMap[eventType] || 'custom';
  }
} 