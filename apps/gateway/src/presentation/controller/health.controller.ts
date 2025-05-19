import { Controller, Get, Inject, OnModuleInit } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { AuthServiceClient } from '@app/libs/infrastructure/grpc/proto';

@ApiTags('Health Check')
@Controller('health')
export class HealthController implements OnModuleInit {
  private authService: AuthServiceClient;
  // private eventService: EventServiceClient;

  constructor(
    @Inject('AUTH_GRPC_CLIENT') private readonly authClient: ClientGrpc,
    @Inject('EVENT_GRPC_CLIENT') private readonly eventClient: ClientGrpc,
  ) { }

  onModuleInit() {
    this.authService = this.authClient.getService<AuthServiceClient>('AuthService');
    // this.eventService = this.eventClient.getService<EventServiceClient>('EventService');
  }

  @Get()
  @ApiOperation({ summary: 'Health Check' })
  check() {
    return { status: 'ok' };
  }

  @Get('auth')
  @ApiOperation({ summary: 'Auth 서비스 연결 상태 확인' })
  async checkAuth() {
    try {
      const response = await firstValueFrom(this.authService.healthCheck({}));
      return { status: 'ok', ...response };
    } catch (error) {
      return {
        status: 'error',
        message: error.code === 14 ? 'Auth 서비스에 연결할 수 없습니다.' : error.message
      };
    }
  }

  // @Get('event')
  // @ApiOperation({ summary: 'Event 서비스 연결 상태 확인' })
  // async checkEvent() {
  //   try {
  //     const response = await firstValueFrom(this.eventService.healthCheck({}));
  //     return { status: 'ok', ...response };
  //   } catch (error) {
  //     return {
  //       status: 'error',
  //       message: error.code === 14 ? 'Event 서비스에 연결할 수 없습니다.' : error.message
  //     };
  //   }
  // }

  // @Get('all')
  // @ApiOperation({ summary: '전체 시스템 상태 확인' })
  // async checkAll() {
  //   const [auth, event] = await Promise.all([
  //     this.checkAuth(),
  //     this.checkEvent()
  //   ]);

  //   return {
  //     gateway: { status: 'ok' },
  //     auth,
  //     event,
  //     healthy: auth.status === 'ok' && event.status === 'ok'
  //   };
  // }
}