import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam } from '@nestjs/swagger';
import { ClaimService } from '../../domain/service/claim.service';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { JwtAuthGuard, RolesGuard, Roles, Public } from '../../../../../libs/auth/src';
import { UserRole } from '@app/libs/common/enum';

/**
 * 감사자(AUDITOR)를 위한 API
 * 
 * 감사자는 모든 보상 요청 내역을 조회할 수 있으나, 수정/승인/거부 권한은 없습니다.
 */
@ApiTags('감사 API')
@Controller('audit')
// @UseGuards(JwtAuthGuard, RolesGuard)
@Public()
// @Roles(UserRole.AUDITOR, UserRole.ADMIN)
export class AuditController {
  constructor(
    private readonly claimService: ClaimService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('AuditController');
  }

  /**
   * 모든 보상 요청 내역을 조회합니다.
   */
  @ApiOperation({ summary: '모든 보상 요청 내역 조회', description: '모든 보상 요청 내역을 페이지네이션하여 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호' })
  @ApiQuery({ name: 'limit', required: false, description: '페이지 크기' })
  @ApiQuery({ name: 'status', required: false, description: '상태 필터 (pending, approved, rejected)' })
  @ApiQuery({ name: 'eventId', required: false, description: '이벤트 ID 필터' })
  @ApiQuery({ name: 'startDate', required: false, description: '시작 날짜 필터 (ISO 형식)' })
  @ApiQuery({ name: 'endDate', required: false, description: '종료 날짜 필터 (ISO 형식)' })
  @ApiResponse({
    status: 200,
    description: '보상 요청 내역 조회 성공'
  })
  @Get('claims')
  async findAllClaims(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('eventId') eventId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    this.logger.debug(`감사자 보상 요청 내역 조회: 페이지 ${page}, 크기 ${limit}`);
    
    // 필터 구성
    const filter: any = {};
    
    if (status) {
      filter.status = status;
    }
    
    if (eventId) {
      filter.eventId = eventId;
    }
    
    // 날짜 필터 처리
    if (startDate || endDate) {
      filter.claimedAt = {};
      
      if (startDate) {
        filter.claimedAt.$gte = new Date(startDate);
      }
      
      if (endDate) {
        filter.claimedAt.$lte = new Date(endDate);
      }
    }
    
    const claims = await this.claimService.findAll(+page, +limit, filter);
    
    return {
      success: true,
      message: '보상 요청 내역 조회 성공',
      data: claims
    };
  }

  /**
   * 특정 보상 요청의 상세 정보를 조회합니다.
   */
  @ApiOperation({ summary: '보상 요청 상세 조회', description: '특정 보상 요청의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '보상 요청 ID' })
  @ApiResponse({
    status: 200,
    description: '보상 요청 상세 조회 성공'
  })
  @ApiResponse({
    status: 404,
    description: '보상 요청을 찾을 수 없음'
  })
  @Get('claims/:id')
  async findClaimById(@Param('id') id: string) {
    this.logger.debug(`감사자 보상 요청 상세 조회: ${id}`);
    
    const claim = await this.claimService.findClaimById(id);
    
    return {
      success: true,
      message: '보상 요청 상세 조회 성공',
      data: claim
    };
  }

  /**
   * 특정 사용자의 보상 요청 내역을 조회합니다.
   */
  @ApiOperation({ summary: '사용자별 보상 요청 내역 조회', description: '특정 사용자의 모든 보상 요청 내역을 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiResponse({
    status: 200,
    description: '사용자별 보상 요청 내역 조회 성공'
  })
  @Get('users/:userId/claims')
  async findClaimsByUser(@Param('userId') userId: string) {
    this.logger.debug(`감사자 사용자별 보상 요청 내역 조회: ${userId}`);
    
    const claims = await this.claimService.findByUser(userId);
    
    return {
      success: true,
      message: '사용자별 보상 요청 내역 조회 성공',
      data: claims
    };
  }

  /**
   * 특정 이벤트의 보상 요청 내역을 조회합니다.
   */
  @ApiOperation({ summary: '이벤트별 보상 요청 내역 조회', description: '특정 이벤트의 모든 보상 요청 내역을 조회합니다.' })
  @ApiParam({ name: 'eventId', description: '이벤트 ID' })
  @ApiResponse({
    status: 200,
    description: '이벤트별 보상 요청 내역 조회 성공'
  })
  @Get('events/:eventId/claims')
  async findClaimsByEvent(@Param('eventId') eventId: string) {
    this.logger.debug(`감사자 이벤트별 보상 요청 내역 조회: ${eventId}`);
    
    const filter = { eventId };
    const claims = await this.claimService.findAll(1, 100, filter);
    
    return {
      success: true,
      message: '이벤트별 보상 요청 내역 조회 성공',
      data: claims
    };
  }
} 