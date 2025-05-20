import { Controller, Get, Post, Put, Delete, Body, Param, Request, HttpCode, HttpStatus, Logger, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiParam } from '@nestjs/swagger';
import { EventFacade } from '../../application/facade';
import { CreateEventDto, UpdateEventDto, ChangeEventStatusDto, EventResponseDto } from '../dto';
import { Public } from '@app/libs/auth';
import { Roles } from '@app/libs/auth';
import { UserRole, ConditionType } from '@app/libs/common/enum';

@ApiTags('이벤트')
@Controller('events')
@Public()
@ApiBearerAuth()
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly eventFacade: EventFacade) { }

  @Post()
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiOperation({ summary: '이벤트 생성', description: '새로운 이벤트를 생성합니다.' })
  @ApiResponse({ status: HttpStatus.CREATED, description: '이벤트가 생성됨', type: EventResponseDto })
  async createEvent(@Body() createEventDto: CreateEventDto, @Request() req): Promise<EventResponseDto> {
    try {
      const { name, description, conditionType, conditionParams, startDate, endDate, metadata } = createEventDto;

      this.logger.log(`이벤트 생성 요청: ${name}, 타입: ${conditionType}`);

      // 조건 타입에 맞는 파라미터 검증
      this.validateConditionParams(conditionType, conditionParams);

      const event = await this.eventFacade.createEvent(
        name,
        description,
        conditionType,
        conditionParams,
        new Date(startDate),
        new Date(endDate),
        { ...metadata, createdBy: req.user?.id || 'system' }
      );

      this.logger.log(`이벤트 생성 성공: ${event.id}`);
      return event;
    } catch (error) {
      this.logger.error(`이벤트 생성 실패: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('이벤트 생성 중 오류가 발생했습니다.');
    }
  }

  @Get()
  @Public()
  @ApiOperation({ summary: '이벤트 목록 조회', description: '모든 이벤트 목록을 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '이벤트 목록 반환', type: [EventResponseDto] })
  async getAllEvents(): Promise<EventResponseDto[]> {
    try {
      this.logger.log('모든 이벤트 조회 요청');
      const events = await this.eventFacade.getAllEvents();
      this.logger.log(`이벤트 조회 성공: ${events.length}개 이벤트 반환`);
      return events;
    } catch (error) {
      this.logger.error(`이벤트 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException('이벤트 목록 조회 중 오류가 발생했습니다.');
    }
  }

  @Get('active')
  @Public()
  @ApiOperation({ summary: '활성 이벤트 조회', description: '현재 활성 상태인 이벤트만 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '활성 이벤트 목록 반환', type: [EventResponseDto] })
  async getActiveEvents(): Promise<EventResponseDto[]> {
    try {
      this.logger.log('활성 이벤트 조회 요청');
      const events = await this.eventFacade.getActiveEvents();
      this.logger.log(`활성 이벤트 조회 성공: ${events.length}개 이벤트 반환`);
      return events;
    } catch (error) {
      this.logger.error(`활성 이벤트 조회 실패: ${error.message}`, error.stack);
      throw new InternalServerErrorException('활성 이벤트 목록 조회 중 오류가 발생했습니다.');
    }
  }

  @Get(':id')
  @Public()
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiOperation({ summary: '이벤트 조회', description: '특정 이벤트를 ID로 조회합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '이벤트 정보 반환', type: EventResponseDto })
  async getEventById(@Param('id') id: string): Promise<EventResponseDto> {
    try {
      this.logger.log(`이벤트 상세 조회 요청: ${id}`);
      const event = await this.eventFacade.getEventById(id);
      if (!event) {
        throw new NotFoundException(`ID가 ${id}인 이벤트를 찾을 수 없습니다.`);
      }
      this.logger.log(`이벤트 상세 조회 성공: ${id}`);
      return event;
    } catch (error) {
      this.logger.error(`이벤트 상세 조회 실패: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('이벤트 조회 중 오류가 발생했습니다.');
    }
  }

  @Put(':id')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiOperation({ summary: '이벤트 수정', description: '특정 이벤트 정보를 수정합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '수정된 이벤트 정보 반환', type: EventResponseDto })
  async updateEvent(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Request() req
  ): Promise<EventResponseDto> {
    try {
      this.logger.log(`이벤트 수정 요청: ${id}`);

      // 만약 조건 타입과 파라미터가 제공되었다면 검증
      if (updateEventDto.conditionType && updateEventDto.conditionParams) {
        this.validateConditionParams(updateEventDto.conditionType, updateEventDto.conditionParams);
      }

      const updateData = {
        ...updateEventDto,
        ...(updateEventDto.startDate && { startDate: new Date(updateEventDto.startDate) }),
        ...(updateEventDto.endDate && { endDate: new Date(updateEventDto.endDate) }),
        metadata: {
          ...updateEventDto.metadata,
          updatedBy: req.user?.id || 'system',
          lastUpdated: new Date().toISOString()
        }
      };

      const event = await this.eventFacade.updateEvent(id, updateData);
      this.logger.log(`이벤트 수정 성공: ${id}`);
      return event;
    } catch (error) {
      this.logger.error(`이벤트 수정 실패: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('이벤트 수정 중 오류가 발생했습니다.');
    }
  }

  @Put(':id/status')
  @Roles(UserRole.OPERATOR, UserRole.ADMIN)
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiOperation({ summary: '이벤트 상태 변경', description: '이벤트의 상태를 변경합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '상태가 변경된 이벤트 정보 반환', type: EventResponseDto })
  async changeEventStatus(
    @Param('id') id: string,
    @Body() changeStatusDto: ChangeEventStatusDto,
    @Request() req
  ): Promise<EventResponseDto> {
    try {
      this.logger.log(`이벤트 상태 변경 요청: ${id}, 새 상태: ${changeStatusDto.status}`);

      let event;
      if (changeStatusDto.status === 'active') {
        event = await this.eventFacade.activateEvent(id);
      } else if (changeStatusDto.status === 'inactive') {
        event = await this.eventFacade.deactivateEvent(id);
      } else {
        throw new BadRequestException('지원하지 않는 상태입니다.');
      }

      // 상태 변경 감사 로그 기록
      await this.eventFacade.updateEvent(id, {
        metadata: {
          statusChangedBy: req.user?.id || 'system',
          statusChangedAt: new Date().toISOString(),
          previousStatus: changeStatusDto.status === 'active' ? 'inactive' : 'active'
        }
      });

      this.logger.log(`이벤트 상태 변경 성공: ${id}, 상태: ${changeStatusDto.status}`);
      return event;
    } catch (error) {
      this.logger.error(`이벤트 상태 변경 실패: ${error.message}`, error.stack);
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('이벤트 상태 변경 중 오류가 발생했습니다.');
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiOperation({ summary: '이벤트 삭제', description: '특정 이벤트를 삭제합니다.' })
  @ApiResponse({ status: HttpStatus.NO_CONTENT, description: '이벤트가 성공적으로 삭제됨' })
  async deleteEvent(@Param('id') id: string): Promise<void> {
    try {
      this.logger.log(`이벤트 삭제 요청: ${id}`);
      await this.eventFacade.deleteEvent(id);
      this.logger.log(`이벤트 삭제 성공: ${id}`);
    } catch (error) {
      this.logger.error(`이벤트 삭제 실패: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('이벤트 삭제 중 오류가 발생했습니다.');
    }
  }

  /**
   * 조건 타입에 따른 파라미터 유효성 검증
   */
  private validateConditionParams(conditionType: ConditionType, conditionParams: Record<string, any>): void {
    switch (conditionType) {
      case ConditionType.LOGIN:
        if (!conditionParams.requiredCount) {
          throw new BadRequestException('로그인 이벤트는 필요 로그인 횟수(requiredCount)가 필요합니다.');
        }
        break;

      case ConditionType.CUSTOM:
        if (!conditionParams.eventCode) {
          throw new BadRequestException('커스텀 이벤트는 이벤트 코드(eventCode)가 필요합니다.');
        }
        break;

      default:
        throw new BadRequestException(`지원하지 않는 조건 타입입니다: ${conditionType}. 현재는 LOGIN과 회원가입(CUSTOM) 이벤트만 지원합니다.`);
    }
  }
}