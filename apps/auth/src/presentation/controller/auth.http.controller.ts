import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Put, UseGuards, Request } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { UserRole } from '@app/libs/common/enum';
import { JwtAuthGuard, RolesGuard, Public, Roles } from '../../../../../libs/auth/src';

// DTO
import {
  AuthResponseDto, LogoutRequestDto,
  TokenResponseDto, RefreshTokenRequestDto,
  RegisterRequestDto, LoginRequestDto,
  UpdateUserRequestDto, ProfileResponseDto
} from '../dto';

// Facade
import { AuthFacade } from '../../application/facade/auth.facade';

/**
 * 인증 컨트롤러
 * 
 * 사용자 인증, 등록, 프로필 관리 등의 엔드포인트를 제공합니다.
 * 로그인, 회원가입, 토큰 갱신, 로그아웃 등의 기능을 처리합니다.
 */
@ApiTags('인증')
@Controller('auth')
export class AuthHttpController {
  constructor(private readonly authFacade: AuthFacade) { }

  /**
   * 회원가입 엔드포인트
   * 
   * 새로운 사용자를 시스템에 등록합니다.
   * 회원가입 성공 시 사용자 정보와 인증 토큰을 반환합니다.
   */
  @Post('register')
  @Public()
  @ApiOperation({ summary: '회원가입', description: '새로운 사용자를 등록하고 토큰을 발급합니다.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '회원가입 성공', type: AuthResponseDto })
  @ApiResponse({ status: HttpStatus.BAD_REQUEST, description: '잘못된 요청' })
  @ApiResponse({ status: HttpStatus.CONFLICT, description: '이미 등록된 이메일' })
  async register(@Body() registerDto: RegisterRequestDto): Promise<AuthResponseDto> {
    console.log('registerDto', registerDto);
    return this.authFacade.register({ ...registerDto });
  }

  /**
   * 로그인 엔드포인트
   * 
   * 사용자 인증 정보를 검증하고 인증 토큰을 발급합니다.
   */
  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '로그인', description: '이메일과 비밀번호로 인증하고 토큰을 발급합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '로그인 성공', type: AuthResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  async login(@Body() loginDto: LoginRequestDto): Promise<AuthResponseDto> {
    return this.authFacade.login({ ...loginDto });
  }

  /**
   * 토큰 갱신 엔드포인트
   * 
   * 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.
   */
  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '토큰 갱신', description: '리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '토큰 갱신 성공', type: TokenResponseDto })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '유효하지 않은 리프레시 토큰' })
  async refresh(@Body() refreshDto: RefreshTokenRequestDto): Promise<TokenResponseDto> {
    return this.authFacade.refreshTokens({ ...refreshDto });
  }

  /**
   * 로그아웃 엔드포인트
   * 
   * 사용자의 현재 세션을 종료하고 토큰을 무효화합니다.
   */
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @ApiOperation({ summary: '로그아웃', description: '현재 세션을 종료하고 토큰을 무효화합니다.' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '로그아웃 성공' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  async logout(@Body() logoutDto: LogoutRequestDto, @Request() req): Promise<void> {
    // JWT 페이로드에서 userId 사용
    const userId = req.user?.userId || logoutDto.userId;
    return this.authFacade.logout({
      userId,
      accessToken: logoutDto.accessToken || req.headers.authorization?.split(' ')[1]
    });
  }

  /**
   * 프로필 조회 엔드포인트
   * 
   * 사용자 ID를 기반으로 프로필 정보를 조회합니다.
   */
  @Get('profile/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiOperation({ summary: '프로필 조회', description: '사용자의 프로필 정보를 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '프로필 조회 성공', type: ProfileResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  async getProfile(@Param('userId') userId: string): Promise<ProfileResponseDto> {
    return this.authFacade.getProfile(userId);
  }

  /**
   * 프로필 업데이트 엔드포인트
   * 
   * 사용자 정보를 업데이트하고 새로운 인증 토큰을 발급합니다.
   */
  @Put('users/:userId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiOperation({ summary: '사용자 정보 업데이트', description: '사용자 정보를 수정하고 새로운 토큰을 발급합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '정보 업데이트 성공', type: AuthResponseDto })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: '사용자를 찾을 수 없음' })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  async updateUser(
    @Param('userId') userId: string,
    @Body() updateUserDto: UpdateUserRequestDto,
    @Request() req
  ): Promise<AuthResponseDto> {
    // JWT에서 userId와 요청 경로의 userId가 일치하는지 확인 (보안)
    if (req.user?.userId !== userId) {
      throw new Error('다른 사용자의 정보를 수정할 수 없습니다.');
    }
    return this.authFacade.updateUser(userId, { ...updateUserDto });
  }

  /**
   * 모든 사용자 조회 엔드포인트 (관리자용)
   * 
   * 시스템에 등록된 모든 사용자 목록을 조회합니다.
   */
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: '모든 사용자 조회 (관리자용)', description: '시스템에 등록된 모든 사용자 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '사용자 목록 조회 성공', type: [ProfileResponseDto] })
  @ApiResponse({ status: HttpStatus.UNAUTHORIZED, description: '인증 실패' })
  @ApiResponse({ status: HttpStatus.FORBIDDEN, description: '권한 없음' })
  async getAllUsers(): Promise<ProfileResponseDto[]> {
    return this.authFacade.getAllUsers();
  }
} 