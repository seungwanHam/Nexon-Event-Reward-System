import { Controller, Get, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('상태 확인')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: '서비스 상태 확인', description: '이벤트 서비스의 상태를 확인합니다.' })
  @ApiResponse({ status: HttpStatus.OK, description: '서비스가 정상적으로 실행 중입니다.' })
  check() {
    return {
      status: 'ok',
      service: 'event',
      timestamp: new Date().toISOString(),
    };
  }
} 