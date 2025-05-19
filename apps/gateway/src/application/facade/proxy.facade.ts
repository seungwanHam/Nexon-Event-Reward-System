import { Injectable, Inject } from '@nestjs/common';
import { Logger, LoggerFactory } from '@app/libs/infrastructure/logger';
import { AuthFacade } from './auth.facade';
import { EventFacade } from './event.facade';

/**
 * 마이크로서비스 요청을 관리하는 퍼사드
 * 외부 HTTP 요청을 받아 내부 gRPC 통신으로 변환합니다.
 */
@Injectable()
export class ProxyFacade {
  private readonly logger: Logger;
  private readonly isDevMode: boolean;

  constructor(
    private readonly authFacade: AuthFacade,
    private readonly eventFacade: EventFacade,
    @Inject('LOGGER_FACTORY') private readonly loggerFactory: LoggerFactory,
  ) {
    this.logger = this.loggerFactory.createLogger('ProxyFacade');
    this.isDevMode = process.env.NODE_ENV === 'development';
    this.logger.log(`프록시 파사드 초기화 완료 (개발 모드: ${this.isDevMode})`);
  }

  // ============================ Auth 서비스 메서드 ============================

  register = this.authFacade.register.bind(this.authFacade);
  login = this.authFacade.login.bind(this.authFacade);
  refreshToken = this.authFacade.refreshToken.bind(this.authFacade);
  logout = this.authFacade.logout.bind(this.authFacade);
  getUserProfile = this.authFacade.getUserProfile.bind(this.authFacade);
  updateUser = this.authFacade.updateUser.bind(this.authFacade);

  // ============================ Event 서비스 메서드 ============================

  getEvents = this.eventFacade.getEvents.bind(this.eventFacade);
  getEvent = this.eventFacade.getEvent.bind(this.eventFacade);
  createEvent = this.eventFacade.createEvent.bind(this.eventFacade);
  updateEvent = this.eventFacade.updateEvent.bind(this.eventFacade);
  deleteEvent = this.eventFacade.deleteEvent.bind(this.eventFacade);
  participateEvent = this.eventFacade.participateEvent.bind(this.eventFacade);
  getRewards = this.eventFacade.getRewards.bind(this.eventFacade);
  getReward = this.eventFacade.getReward.bind(this.eventFacade);
  claimReward = this.eventFacade.claimReward.bind(this.eventFacade);
} 