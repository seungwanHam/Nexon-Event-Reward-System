import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, HttpStatus, Req, ForbiddenException, HttpCode } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Public, Roles } from '../../../../../libs/auth/src';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@app/libs/common/enum';
import { EventFacade } from '@app/gateway/application/facade';

/**
 * 청구 관련 컨트롤러
 * 
 * 보상 청구, 승인, 거부 및 조회 API 엔드포인트를 제공합니다.
 */
@ApiTags('청구 API')
@Controller('claims')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ClaimController {
  constructor(private readonly eventFacade: EventFacade) { }

  /**
   * 보상 청구 생성
   */
  @ApiOperation({ summary: '보상 청구 생성', description: '사용자가 보상을 청구합니다.' })
  @ApiBody({
    description: '청구 정보',
    schema: {
      type: 'object',
      required: ['eventId'],
      properties: {
        userId: { type: 'string', example: 'user-123' },
        eventId: { type: 'string', example: 'event-123' }
      }
    }
  })
  @ApiResponse({ status: 201, description: '청구 생성 성공' })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post()
  async createClaim(@Body() claimData: any, @Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.createClaim(
      userId,
      claimData.eventId
    );
    return {
      success: true,
      message: '보상 청구 요청 성공',
      data: result
    };
  }

  /**
   * 사용자 보상 청구 목록 조회
   */
  @ApiOperation({ summary: '사용자 청구 목록 조회', description: '현재 사용자의 보상 청구 목록을 조회합니다.' })
  @ApiResponse({ status: 200, description: '사용자 보상 청구 목록 조회 성공' })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('user')
  async getUserClaims(@Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.getUserClaims(userId);

    return {
      success: true,
      message: '사용자 보상 청구 목록 조회 성공',
      data: result
    };
  }

  /**
   * 모든 청구 목록 조회 (감사/관리자용)
   */
  @ApiOperation({ summary: '모든 청구 목록 조회', description: '모든 보상 청구 목록을 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', type: Number })
  @ApiQuery({ name: 'status', required: false, description: '상태 필터', type: String })
  @ApiResponse({ status: 200, description: '청구 목록 조회 성공' })
  @Roles(UserRole.AUDITOR, UserRole.ADMIN)
  @Get()
  async getAllClaims(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string
  ) {
    const filter = status ? { status } : {};
    const result = await this.eventFacade.getAllClaims(+page, +limit, filter);
    return {
      success: true,
      message: '청구 목록 조회 성공',
      data: result
    };
  }

  /**
   * 특정 사용자의 청구 목록 조회 (감사/관리자용)
   */
  @ApiOperation({ summary: '사용자별 청구 목록 조회', description: '특정 사용자의 모든 보상 청구를 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자별 청구 목록 조회 성공' })
  @Roles(UserRole.AUDITOR, UserRole.ADMIN)
  @Get('users/:userId')
  async getUserClaimsForAudit(@Param('userId') userId: string) {
    const result = await this.eventFacade.getUserClaimsForAudit(userId);
    return {
      success: true,
      message: '사용자별 청구 목록 조회 성공',
      data: result
    };
  }

  /**
   * 청구 승인
   */
  @ApiOperation({ summary: '청구 승인', description: '보상 청구를 승인합니다.' })
  @ApiParam({ name: 'claimId', description: '청구 ID' })
  @ApiBody({
    description: '승인 정보',
    schema: {
      type: 'object',
      required: ['approverId'],
      properties: {
        approverId: { type: 'string', example: 'admin-123' }
      }
    }
  })
  @ApiResponse({ status: 200, description: '청구 승인 성공' })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @Put(':claimId/approve')
  async approveClaim(
    @Param('claimId') claimId: string,
    @Body('approverId') approverId: string
  ) {
    const result = await this.eventFacade.approveClaim(claimId, approverId);
    return {
      success: true,
      message: '청구 승인 성공',
      data: result
    };
  }

  /**
   * 청구 거부
   */
  @ApiOperation({ summary: '청구 거부', description: '보상 청구를 거부합니다.' })
  @ApiParam({ name: 'claimId', description: '청구 ID' })
  @ApiBody({
    description: '거부 정보',
    schema: {
      type: 'object',
      required: ['approverId', 'reason'],
      properties: {
        approverId: { type: 'string', example: 'admin-123' },
        reason: { type: 'string', example: '중복 지급 요청' }
      }
    }
  })
  @ApiResponse({ status: 200, description: '청구 거부 성공' })
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @Put(':claimId/reject')
  async rejectClaim(
    @Param('claimId') claimId: string,
    @Body() rejectData: any
  ) {
    const result = await this.eventFacade.rejectClaim(claimId, rejectData.approverId, rejectData.reason);
    return {
      success: true,
      message: '청구 거부 성공',
      data: result
    };
  }

  /**
   * 이벤트 자격 조건 평가
   */
  @ApiOperation({ summary: '이벤트 자격 평가', description: '사용자의 이벤트 참여 자격을 평가합니다.' })
  @ApiBody({
    description: '평가 정보',
    schema: {
      type: 'object',
      required: ['eventId'],
      properties: {
        eventId: { type: 'string', example: 'event-123' },
        actionData: { type: 'object', example: { loginCount: 5 } }
      }
    }
  })
  @ApiResponse({ status: 200, description: '평가 성공' })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Post('evaluate')
  async evaluateCondition(@Body() evaluateData: any, @Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.evaluateCondition(
      userId,
      evaluateData.eventId,
      evaluateData.actionData
    );
    return {
      success: true,
      message: '자격 평가 완료',
      data: { eligible: result }
    };
  }

  /**
   * 이벤트 자격 확인
   */
  @ApiOperation({ summary: '이벤트 자격 확인', description: '사용자가 특정 이벤트의 보상을 받을 자격이 있는지 확인합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '자격 확인 성공' })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('eligible/:eventId')
  async checkEligibility(@Param('eventId') eventId: string, @Req() req: any) {
    const userId = req.user.userId;
    const result = await this.eventFacade.evaluateCondition(userId, eventId, {});
    return {
      success: true,
      message: '자격 확인 완료',
      data: { eligible: result }
    };
  }

  /**
   * 이벤트 이미 청구 여부 확인
   */
  @ApiOperation({ summary: '청구 여부 확인', description: '사용자가 특정 이벤트의 보상을 이미 청구했는지 확인합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '청구 여부 확인 성공' })
  @Roles(UserRole.USER, UserRole.ADMIN)
  @Get('claimed/:eventId')
  async checkClaimed(@Param('eventId') eventId: string, @Req() req: any) {
    const userId = req.user.userId;
    const userClaims = await this.eventFacade.getUserClaims(userId);
    
    // 사용자의 청구 목록에서 해당 이벤트 ID와 관련된 보상 중 성공적으로 청구된 것이 있는지 확인
    const eventRewards = await this.eventFacade.getEventRewards(eventId);
    const rewardIds = eventRewards.map(reward => reward.id || reward._id);
    
    // 사용자가 이 이벤트의 보상을 청구했는지 확인
    const claimed = userClaims.some(claim => 
      rewardIds.includes(claim.rewardId) && 
      ['approved', 'pending'].includes(claim.status)
    );
    
    return {
      success: true,
      message: '청구 여부 확인 완료',
      data: { claimed }
    };
  }
} 