import { Controller, Get, Injectable } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { catchError, firstValueFrom } from 'rxjs';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

@ApiTags('Health Check')
@Controller('health')
@Injectable()
export class HealthController {
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly logger: WinstonLoggerService,
  ) {
    this.authServiceUrl = this.configService.get<string>('AUTH_SERVICE_URL', 'http://localhost:3002');
  }

  private readonly authServiceUrl: string;

  @Get()
  @ApiOperation({ summary: 'Health Check' })
  check() {
    return { status: 'ok' };
  }

  @Get('auth')
  @ApiOperation({ summary: 'Auth 서비스 연결 상태 확인' })
  async checkAuth() {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.authServiceUrl}/health`).pipe(
          catchError((error) => {
            this.logger.error('Auth 서비스 헬스 체크 실패:', error);
            throw {
              status: 'error',
              message: 'Auth 서비스에 연결할 수 없습니다.',
              details: error.message
            };
          }),
        ),
      );
      return { status: 'ok', ...data };
    } catch (error) {
      return {
        status: 'error',
        message: error.message || 'Auth 서비스에 연결할 수 없습니다.'
      };
    }
  }

  @Get('all')
  @ApiOperation({ summary: '전체 시스템 상태 확인' })
  async checkAll() {
    const auth = await this.checkAuth();

    return {
      gateway: { status: 'ok' },
      auth,
      healthy: auth.status === 'ok'
    };
  }
}