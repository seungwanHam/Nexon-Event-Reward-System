import { Controller, Get } from '@nestjs/common';

// DTO
import { ApiResponse } from '@app/libs/common/dto';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return ApiResponse.success({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        db: 'up',
        api: 'up'
      }
    });
  }
} 