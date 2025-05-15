import { Controller, Get, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

@Controller()
export class GatewayController {
  constructor(
    @Inject('AUTH_SERVICE') private readonly authClient: ClientProxy,
    @Inject('EVENT_SERVICE') private readonly eventClient: ClientProxy,
  ) { }

  @Get()
  getHello(): string {
    return 'Hello from Gateway Service!';
  }

  @Get('auth-status')
  async getAuthServiceStatus() {
    try {
      const result = await firstValueFrom(
        this.authClient.send({ cmd: 'ping' }, {}),
      );
      return { status: 'Auth Service is online', response: result };
    } catch (error) {
      return { status: 'Auth Service is offline', error: error.message };
    }
  }

  @Get('event-status')
  async getEventServiceStatus() {
    try {
      const result = await firstValueFrom(
        this.eventClient.send({ cmd: 'ping' }, {}),
      );
      return { status: 'Event Service is online', response: result };
    } catch (error) {
      return { status: 'Event Service is offline', error: error.message };
    }
  }
} 