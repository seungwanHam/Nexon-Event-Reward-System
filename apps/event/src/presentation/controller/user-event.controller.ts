import { Controller, Post, Get, Body, Param, Query, Logger, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateUserEventDto } from '../dto/create-user-event.dto';
import { UserEventService } from '../../domain/service/user-event.service';
import { Public } from '../../../../../libs/auth/src';

/**
 * 사용자 이벤트 컨트롤러
 * 
 * 사용자 행동 이벤트 기록 및 조회를 위한 API 엔드포인트를 제공합니다.
 */
@ApiTags('User Events')
@Public()
@Controller('user-events')
export class UserEventController {
  private readonly logger = new Logger(UserEventController.name);

  constructor(private readonly userEventService: UserEventService) { }

  /**
   * 이벤트 생성 API
   * 
   * 사용자 행동 이벤트를 기록합니다. 인증 필요 없음 (다른 서비스에서의 호출 허용)
   * 
   * @param createEventDto - 생성할 이벤트 정보
   * @returns 생성된 이벤트
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '사용자 이벤트 기록', description: '사용자 행동 이벤트(로그인, 회원가입 등)를 기록합니다. 다른 서비스에서 호출 가능합니다.' })
  @ApiResponse({ status: 201, description: '이벤트가 성공적으로 기록됨' })
  @ApiResponse({ status: 400, description: '잘못된 요청 형식' })
  @ApiResponse({ status: 409, description: '중복 이벤트 (멱등성 키 충돌)' })
  async createEvent(@Body() createEventDto: CreateUserEventDto) {
    this.logger.debug(`사용자 이벤트 기록 요청: ${createEventDto.eventType} for ${createEventDto.userId}`);

    const event = await this.userEventService.recordUserEvent({
      userId: createEventDto.userId,
      eventType: createEventDto.eventType,
      eventKey: createEventDto.eventKey,
      occurredAt: createEventDto.occurredAt,
      metadata: createEventDto.metadata,
      idempotencyKey: createEventDto.idempotencyKey,
    });

    return {
      id: event.id,
      userId: event.userId,
      eventType: event.eventType,
      eventKey: event.eventKey,
      occurredAt: event.occurredAt.toISOString(),
      metadata: event.metadata,
    };
  }

  /**
   * 사용자별 이벤트 조회 API
   * 
   * 특정 사용자의 이벤트 목록을 조회합니다. 인증 필요.
   * 
   * @param userId - 사용자 ID
   * @param eventType - 이벤트 타입 (선택 사항)
   * @returns 이벤트 목록
   */
  @Get('user/:userId')
  @ApiBearerAuth()
  @ApiOperation({ summary: '사용자별 이벤트 조회', description: '특정 사용자의 이벤트 목록을 조회합니다.' })
  @ApiParam({ name: 'userId', description: '사용자 ID' })
  @ApiQuery({ name: 'eventType', description: '이벤트 타입으로 필터링', required: false })
  @ApiResponse({ status: 200, description: '이벤트 목록 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  async getUserEvents(
    @Param('userId') userId: string,
    @Query('eventType') eventType?: string,
  ) {
    this.logger.debug(`사용자 이벤트 조회 요청: ${userId}, 이벤트 타입: ${eventType || '전체'}`);

    const events = await this.userEventService.getUserEvents(userId, eventType);

    return events.map(event => ({
      id: event.id,
      userId: event.userId,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  /**
   * 이벤트 상세 조회 API
   * 
   * 특정 ID의 이벤트를 조회합니다. 인증 필요.
   * 
   * @param id - 이벤트 ID
   * @returns 이벤트 상세 정보
   */
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: '이벤트 상세 조회', description: '특정 ID의 이벤트 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ status: 200, description: '이벤트 정보 반환' })
  @ApiResponse({ status: 401, description: '인증 필요' })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  async getEvent(@Param('id') id: string) {
    this.logger.debug(`이벤트 상세 조회 요청: ${id}`);

    const event = await this.userEventService.getEvent(id);

    if (!event) {
      return { message: '이벤트를 찾을 수 없습니다.' };
    }

    return {
      id: event.id,
      userId: event.userId,
      eventType: event.eventType,
      occurredAt: event.occurredAt.toISOString(),
      metadata: event.metadata,
      createdAt: event.createdAt.toISOString(),
    };
  }
} 