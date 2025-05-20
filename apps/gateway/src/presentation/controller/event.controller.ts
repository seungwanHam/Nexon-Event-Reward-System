import { Body, Controller, Delete, Get, Param, Post, Put, Query, UseGuards, HttpStatus, Req, HttpCode } from '@nestjs/common';
import { JwtAuthGuard, RolesGuard, Public, Roles } from '../../../../../libs/auth/src';
import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@app/libs/common/enum';
import { EventFacade } from '@app/gateway/application/facade';

/**
 * 이벤트 관련 컨트롤러
 * 
 * 이벤트 관리 API 엔드포인트를 제공합니다.
 */
@ApiTags('이벤트 API')
@Controller('events')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EventController {
  constructor(private readonly eventFacade: EventFacade) { }

  // ==================== 이벤트 API ====================

  /**
   * 이벤트 목록 조회
   */
  @ApiOperation({ summary: '이벤트 목록 조회', description: '이벤트 목록을 페이지네이션으로 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호', type: Number })
  @ApiQuery({ name: 'limit', required: false, description: '페이지당 항목 수', type: Number })
  @ApiQuery({ name: 'status', required: false, description: '이벤트 상태 필터', type: String })
  @ApiQuery({ name: 'startDate', required: false, description: '시작일 필터 (ISO 형식)', type: String })
  @ApiQuery({ name: 'endDate', required: false, description: '종료일 필터 (ISO 형식)', type: String })
  @ApiQuery({ name: 'search', required: false, description: '검색어 (이름, 설명)', type: String })
  @ApiQuery({ name: 'tags', required: false, description: '태그 필터 (쉼표로 구분)', type: String })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 목록 조회 성공' },
        data: {
          type: 'object',
          properties: {
            items: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '60d3b41667948b2d347e12b8' },
                  name: { type: 'string', example: '신규 가입 이벤트' },
                  description: { type: 'string', example: '신규 가입 사용자를 위한 이벤트' },
                  status: { type: 'string', example: 'active' },
                  startDate: { type: 'string', format: 'date-time', example: '2023-05-01T00:00:00Z' },
                  endDate: { type: 'string', format: 'date-time', example: '2023-06-01T23:59:59Z' },
                  conditionType: { type: 'string', example: 'login' },
                  conditionParams: { type: 'object', example: { requiredDays: 5 } },
                  createdAt: { type: 'string', format: 'date-time', example: '2023-04-15T12:00:00Z' }
                }
              }
            },
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 10 },
            total: { type: 'integer', example: 25 },
            totalPages: { type: 'integer', example: 3 }
          }
        }
      }
    }
  })
  @Public()
  @Get()
  async getEvents(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('search') search?: string,
    @Query('tags') tags?: string,
  ) {
    // 필터 구성
    const filter: any = {};

    if (status) filter.status = status;
    if (startDate) filter.startDate = startDate;
    if (endDate) filter.endDate = endDate;
    if (search) filter.search = search;

    // 태그 처리
    if (tags) {
      filter.tags = tags.split(',').map(tag => tag.trim());
    }

    const result = await this.eventFacade.getEvents(+page, +limit, filter);

    return {
      success: true,
      message: '이벤트 목록 조회 성공',
      data: result
    };
  }

  /**
   * 활성화된 이벤트 목록 조회
   */
  @ApiOperation({ summary: '활성화된 이벤트 목록 조회', description: '현재 활성화된 이벤트 목록을 조회합니다.' })
  @ApiResponse({ 
    status: 200, 
    description: '활성화된 이벤트 목록 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '활성화된 이벤트 목록 조회 성공' },
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', example: '60d3b41667948b2d347e12b8' },
              name: { type: 'string', example: '출석 체크 이벤트' },
              description: { type: 'string', example: '3일 연속 출석시 보상' },
              status: { type: 'string', example: 'active' },
              startDate: { type: 'string', format: 'date-time' },
              endDate: { type: 'string', format: 'date-time' },
              conditionType: { type: 'string', example: 'login' },
              rewards: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string', example: '골드 보상' },
                    type: { type: 'string', example: 'currency' }
                  }
                }
              }
            }
          }
        }
      }
    }
  })
  @Public()
  @Get('active')
  async getActiveEvents() {
    const result = await this.eventFacade.getActiveEvents();

    return {
      success: true,
      message: '활성화된 이벤트 목록 조회 성공',
      data: result
    };
  }

  /**
   * 특정 이벤트 상세 정보 조회
   */
  @ApiOperation({ summary: '이벤트 상세 조회', description: '특정 이벤트의 상세 정보를 조회합니다.' })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 상세 조회 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 상세 조회 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12b8' },
            name: { type: 'string', example: '신규 가입 이벤트' },
            description: { type: 'string', example: '신규 가입 사용자를 위한 이벤트' },
            status: { type: 'string', example: 'active' },
            startDate: { type: 'string', format: 'date-time', example: '2023-05-01T00:00:00Z' },
            endDate: { type: 'string', format: 'date-time', example: '2023-06-01T23:59:59Z' },
            conditionType: { type: 'string', example: 'login' },
            conditionParams: { type: 'object', example: { requiredDays: 5 } },
            createdAt: { type: 'string', format: 'date-time', example: '2023-04-15T12:00:00Z' },
            createdBy: { type: 'string', example: '60d3b41667948b2d347e12b1' },
            rewards: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: '60d3b41667948b2d347e12c5' },
                  name: { type: 'string', example: '신규 가입 보상' },
                  type: { type: 'string', example: 'item' },
                  amount: { type: 'integer', example: 1 },
                  description: { type: 'string', example: '신규 가입자 환영 아이템' }
                }
              }
            }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 404, 
    description: '이벤트를 찾을 수 없음',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '이벤트를 찾을 수 없습니다' },
        error: { type: 'string', example: 'NotFound' }
      }
    }
  })
  @Public()
  @Get(':id')
  async getEvent(@Param('id') id: string) {
    const result = await this.eventFacade.getEvent(id);

    return {
      success: true,
      message: '이벤트 상세 조회 성공',
      data: result
    };
  }

  /**
   * 이벤트 생성
   */
  @ApiOperation({ summary: '이벤트 생성', description: '새로운 이벤트를 생성합니다.' })
  @ApiBody({
    description: '이벤트 생성 정보',
    schema: {
      type: 'object',
      required: ['name', 'description', 'startDate', 'endDate'],
      properties: {
        name: { type: 'string', example: '신규 가입 이벤트' },
        description: { type: 'string', example: '신규 가입 사용자를 위한 이벤트' },
        startDate: { type: 'string', format: 'date-time', example: '2023-05-01T00:00:00Z' },
        endDate: { type: 'string', format: 'date-time', example: '2023-06-01T23:59:59Z' },
        conditionType: { type: 'string', example: 'login' },
        conditionParams: { type: 'object', example: { requiredDays: 5 } },
        metadata: { type: 'object', example: { theme: 'summer' } }
      }
    }
  })
  @ApiResponse({ 
    status: 201, 
    description: '이벤트 생성 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 생성 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12b8' },
            name: { type: 'string', example: '신규 가입 이벤트' }
          }
        }
      }
    }
  })
  @ApiResponse({ 
    status: 400, 
    description: '잘못된 요청 데이터',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: false },
        message: { type: 'string', example: '유효하지 않은 이벤트 데이터' },
        error: { type: 'string', example: 'BadRequest' }
      }
    }
  })
  @Roles(UserRole.ADMIN)
  @Post()
  async createEvent(@Body() eventData: any, @Req() req: any) {
    // 현재 로그인한 사용자 ID를 createdBy 필드에 추가
    const dataWithCreator = {
      ...eventData,
      createdBy: req.user.userId
    };

    const result = await this.eventFacade.createEvent(dataWithCreator);

    return {
      success: true,
      message: '이벤트 생성 성공',
      data: result
    };
  }

  /**
   * 이벤트 수정
   */
  @ApiOperation({ summary: '이벤트 수정', description: '기존 이벤트 정보를 수정합니다.' })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 수정 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 수정 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12b8' },
            name: { type: 'string', example: '수정된 이벤트 이름' }
          }
        }
      }
    }
  })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @Roles(UserRole.ADMIN)
  @Put(':id')
  async updateEvent(
    @Param('id') id: string,
    @Body() eventData: any,
    @Req() req: any
  ) {
    // 현재 사용자 정보를 updatedBy 필드에 추가
    const dataWithUpdater = {
      ...eventData,
      updatedBy: req.user.userId
    };

    const result = await this.eventFacade.updateEvent(id, dataWithUpdater);

    return {
      success: true,
      message: '이벤트 수정 성공',
      data: result
    };
  }

  /**
   * 이벤트 상태 수정
   */
  @ApiOperation({ summary: '이벤트 상태 수정', description: '이벤트의 상태를 변경합니다.' })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiBody({
    description: '이벤트 상태 정보',
    schema: {
      type: 'object',
      required: ['status'],
      properties: {
        status: {
          type: 'string',
          enum: ['active', 'inactive'],
          example: 'active'
        }
      }
    }
  })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 상태 수정 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 상태 수정 성공' },
        data: {
          type: 'object',
          properties: {
            id: { type: 'string', example: '60d3b41667948b2d347e12b8' },
            status: { type: 'string', example: 'active' }
          }
        }
      }
    }
  })
  @Roles(UserRole.ADMIN)
  @Put(':id/status')
  async updateEventStatus(
    @Param('id') id: string,
    @Body('status') status: string
  ) {
    const result = await this.eventFacade.updateEventStatus(id, status);

    return {
      success: true,
      message: '이벤트 상태 수정 성공',
      data: result
    };
  }

  /**
   * 이벤트 삭제
   */
  @ApiOperation({ summary: '이벤트 삭제', description: '이벤트를 삭제합니다.' })
  @ApiParam({ name: 'id', description: '이벤트 ID' })
  @ApiResponse({ 
    status: 200, 
    description: '이벤트 삭제 성공',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: '이벤트 삭제 성공' },
        data: { type: 'object', properties: {} }
      }
    }
  })
  @ApiResponse({ status: 404, description: '이벤트를 찾을 수 없음' })
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async deleteEvent(@Param('id') id: string) {
    const result = await this.eventFacade.deleteEvent(id);

    return {
      success: true,
      message: '이벤트 삭제 성공',
      data: result
    };
  }
} 