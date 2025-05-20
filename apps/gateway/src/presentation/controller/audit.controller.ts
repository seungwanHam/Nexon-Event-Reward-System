import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard, Roles } from '../../../../../libs/auth/src';
import { UserRole } from '@app/libs/common/enum';
import { EventFacade } from '@app/gateway/application/facade';

/**
 * 감사 관련 컨트롤러
 * 
 * 감사 관련 API 엔드포인트를 제공합니다.
 */
@ApiTags('감사 API')
@Controller('audit')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AUDITOR, UserRole.ADMIN)
export class AuditController {
  constructor(private readonly eventFacade: EventFacade) { }

  /**
   * 감사 로그 목록 조회
   */
  @ApiOperation({ summary: '감사 로그 목록 조회', description: '감사 로그 목록을 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', type: Number })
  @ApiResponse({ status: 200, description: '감사 로그 목록 조회 성공' })
  @Get('logs')
  async getAuditLogs(
    @Query('page') page = 1,
    @Query('limit') limit = 10
  ) {
    // 실제 감사 로그 조회 구현
    const filter = {};
    const result = await this.eventFacade.getAllClaims(+page, +limit, filter);
    
    return {
      success: true,
      message: '감사 로그 목록 조회 성공',
      data: {
        items: result.items || result,
        page: +page,
        limit: +limit,
        total: result.total || result.length,
        totalPages: result.totalPages || Math.ceil((result.total || result.length) / +limit)
      }
    };
  }

  /**
   * 특정 이벤트의 감사 로그 조회
   */
  @ApiOperation({ summary: '이벤트 감사 로그 조회', description: '특정 이벤트의 감사 로그를 조회합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 감사 로그 조회 성공' })
  @Get('events/:eventId')
  async getEventAuditLogs(@Param('eventId') eventId: string) {
    // 특정 이벤트와 관련된 모든 보상 조회
    const rewards = await this.eventFacade.getEventRewards(eventId);
    const rewardIds = rewards.map(reward => reward.id || reward._id);
    
    // 해당 보상들에 대한 모든 청구 조회
    const filter = { 
      rewardIds: { $in: rewardIds } 
    };
    const claims = await this.eventFacade.getAllClaims(1, 100, filter);
    
    return {
      success: true,
      message: '이벤트 감사 로그 조회 성공',
      data: {
        items: claims.items || claims,
        eventId,
        total: claims.total || claims.length
      }
    };
  }

  /**
   * 특정 사용자의 청구 목록 조회 (감사용)
   */
  @ApiOperation({ summary: '사용자별 청구 목록 조회', description: '특정 사용자의 모든 보상 청구를 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({ status: 200, description: '사용자별 청구 목록 조회 성공' })
  @Get('users/:userId/claims')
  async getUserClaimsForAudit(@Param('userId') userId: string) {
    const result = await this.eventFacade.getUserClaimsForAudit(userId);
    return {
      success: true,
      message: '사용자별 청구 목록 조회 성공',
      data: result
    };
  }
} 