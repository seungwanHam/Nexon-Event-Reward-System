import { Injectable, Inject, ConflictException, BadRequestException } from '@nestjs/common';
import { RewardClaimEntity } from '../entity/reward-claim.entity';
import { REWARD_CLAIM_REPOSITORY, RewardClaimRepository } from '../repository/reward-claim.repository.interface';
import { REWARD_REPOSITORY, RewardRepository } from '../repository/reward.repository.interface';
import { EVENT_REPOSITORY, EventRepository } from '../repository/event.repository.interface';
import { RULE_ENGINE, RuleEngine } from './rule-engine.interface';
import { ClaimStatus } from '@app/libs/common/enum';
import { EventNotFoundException, NotFoundException } from '@app/libs/common/exception';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';
import { CreateClaimDto } from '../dto/create-claim.dto';
import { EventValidatorService } from './event-validator.service';
import { RewardService } from './reward.service';

/**
 * 중복 보상 예외
 */
export class DuplicateClaimException extends BadRequestException {
  constructor(message?: string) {
    super(message || '이미 보상을 받은 이벤트입니다');
  }
}

/**
 * 이벤트 조건 불충족 예외
 */
export class EventConditionNotMetException extends BadRequestException {
  constructor(message?: string) {
    super(message || '이벤트 조건을 충족하지 않았습니다');
  }
}

@Injectable()
export class ClaimService {
  constructor(
    @Inject(REWARD_CLAIM_REPOSITORY)
    private readonly claimRepository: RewardClaimRepository,
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: RewardRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
    @Inject(RULE_ENGINE)
    private readonly ruleEngine: RuleEngine,
    private readonly logger: WinstonLoggerService,
    private readonly eventValidatorService: EventValidatorService,
    private readonly rewardService: RewardService,
  ) {
    this.logger.setContext('ClaimService');
  }

  /**
   * 보상 청구를 생성합니다.
   */
  async createClaim(
    userId: string,
    eventId: string,
    rewardId: string,
  ): Promise<RewardClaimEntity> {
    this.logger.debug(`보상 청구 요청: 사용자 ${userId}, 이벤트 ${eventId}, 보상 ${rewardId}`);

    // 이벤트 유효성 확인
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      this.logger.warn(`존재하지 않는 이벤트: ${eventId}`);
      throw new EventNotFoundException('이벤트를 찾을 수 없습니다.');
    }

    // Date 객체로 변환
    if (typeof event.startDate === 'string') {
      this.logger.debug(`이벤트 ${eventId} 시작일 변환: ${event.startDate}`);
      event.startDate = new Date(event.startDate);
    }
    if (typeof event.endDate === 'string') {
      this.logger.debug(`이벤트 ${eventId} 종료일 변환: ${event.endDate}`);
      event.endDate = new Date(event.endDate);
    }

    this.logger.debug(`이벤트 ${eventId} 상태: ${event.status}, 시작일: ${event.startDate}, 종료일: ${event.endDate}`);

    if (!event.isValid()) {
      this.logger.warn(`비활성 또는 기간 외 이벤트: ${eventId}, 상태 ${event.status}`);
      throw new BadRequestException('활성 상태 및 유효 기간의 이벤트만 청구할 수 있습니다.');
    }

    // 보상 존재 확인
    const reward = await this.rewardRepository.findById(rewardId);
    if (!reward) {
      this.logger.warn(`존재하지 않는 보상: ${rewardId}`);
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }

    // 이벤트와 보상이 연결되어 있는지 확인
    if (reward.eventId !== eventId) {
      this.logger.warn(`이벤트-보상 불일치: 이벤트 ${eventId}, 보상 ${rewardId}, 보상에 연결된 이벤트 ${reward.eventId}`);
      throw new BadRequestException('보상이 해당 이벤트에 연결되어 있지 않습니다.');
    }

    // 중복 청구 확인 - 이벤트 자체에 대한 중복 청구
    const existingEventClaims = await this.claimRepository.findByUserAndEvent(userId, eventId);
    if (existingEventClaims.length > 0) {
      this.logger.warn(`이벤트 중복 청구: 사용자 ${userId}, 이벤트 ${eventId}`);
      throw new ConflictException('이미 이 이벤트의 보상을 청구하셨습니다.');
    }

    // 중복 청구 확인 - 특정 보상에 대한 중복 청구
    const existingRewardClaims = await this.claimRepository.findByUserAndReward(userId, rewardId);
    if (existingRewardClaims.length > 0) {
      this.logger.warn(`보상 중복 청구: 사용자 ${userId}, 보상 ${rewardId}`);
      throw new ConflictException('이미 이 보상을 청구하셨습니다.');
    }

    // 자격 조건 검증
    const validationResult = await this.ruleEngine.validateEventConditions(userId, eventId);
    if (!validationResult.isValid) {
      this.logger.warn(`조건 불충족: 사용자 ${userId}, 이벤트 ${eventId}, 사유: ${validationResult.errorMessage}`);
      throw new BadRequestException(validationResult.errorMessage || '이 보상을 받을 자격 조건을 충족하지 않았습니다.');
    }

    // 청구 생성
    const claim = RewardClaimEntity.create({
      userId,
      eventId,
      rewardId,
      status: reward.needsApproval() ? ClaimStatus.PENDING : ClaimStatus.APPROVED,
      requestDate: new Date(),
      metadata: {
        validationResult: validationResult.metadata,
        claimedAt: new Date().toISOString()
      }
    });

    this.logger.debug(`청구 생성: ${JSON.stringify(claim)}`);
    await this.claimRepository.save(claim);

    // 자동 승인 보상인 경우 완료 처리
    if (!reward.needsApproval()) {
      this.logger.debug(`자동 승인 보상: ${rewardId}`);
      claim.complete();
      await this.claimRepository.save(claim);
    }

    this.logger.info(`보상 청구 성공: 사용자 ${userId}, 이벤트 ${eventId}, 보상 ${rewardId}, 상태 ${claim.status}`);
    return claim;
  }

  /**
   * 청구를 승인합니다.
   */
  async approveClaim(
    claimId: string,
    approverId: string,
  ): Promise<RewardClaimEntity> {
    const claim = await this.findClaimById(claimId);

    if (!claim.isPending()) {
      throw new BadRequestException('승인 대기 상태의 청구만 승인할 수 있습니다.');
    }

    claim.approve(approverId);
    await this.claimRepository.save(claim);

    // 여기서 실제 보상 지급 로직을 구현할 수 있습니다.
    // 지급 후 상태 업데이트
    claim.complete();
    await this.claimRepository.save(claim);

    return claim;
  }

  /**
   * 청구를 거부합니다.
   */
  async rejectClaim(
    claimId: string,
    approverId: string,
    reason: string,
  ): Promise<RewardClaimEntity> {
    const claim = await this.findClaimById(claimId);

    if (!claim.isPending()) {
      throw new BadRequestException('승인 대기 상태의 청구만 거부할 수 있습니다.');
    }

    claim.reject(approverId, reason);
    await this.claimRepository.save(claim);

    return claim;
  }

  /**
   * 사용자의 모든 청구를 조회합니다.
   */
  async findClaimsByUserId(userId: string): Promise<RewardClaimEntity[]> {
    return this.claimRepository.findByUserId(userId);
  }

  /**
   * 이벤트에 대한 모든 청구를 조회합니다.
   */
  async findClaimsByEventId(eventId: string): Promise<RewardClaimEntity[]> {
    // 이벤트 존재 확인
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    return this.claimRepository.findByEventId(eventId);
  }

  /**
   * 특정 상태의 모든 청구를 조회합니다.
   */
  async findClaimsByStatus(status: ClaimStatus): Promise<RewardClaimEntity[]> {
    return this.claimRepository.findByStatus(status);
  }

  /**
   * 모든 청구를 조회합니다.
   */
  async findAllClaims(): Promise<RewardClaimEntity[]> {
    return this.claimRepository.findAll();
  }

  /**
   * ID로 청구를 조회합니다.
   */
  async findClaimById(id: string): Promise<RewardClaimEntity> {
    const claim = await this.claimRepository.findById(id);
    if (!claim) {
      throw new NotFoundException('보상 청구를 찾을 수 없습니다.');
    }
    return claim;
  }

  /**
   * 새로운 보상 청구를 처리합니다.
   * 
   * @param createClaimDto 보상 청구 데이터
   * @returns 생성된 청구 정보
   * @throws DuplicateClaimException 이미 보상을 받은 경우
   * @throws EventConditionNotMetException 이벤트 조건을 충족하지 않은 경우
   */
  async create(createClaimDto: CreateClaimDto) {
    const { userId, rewardId } = createClaimDto;

    this.logger.debug(`보상 청구 요청: 사용자 ${userId}, 보상 ${rewardId}`);

    // 보상 정보 조회
    const reward = await this.rewardService.findById(rewardId);

    if (!reward) {
      this.logger.warn(`존재하지 않는 보상: ${rewardId}`);
      throw new NotFoundException(`보상 ID ${rewardId}를 찾을 수 없습니다`);
    }

    const eventId = reward.eventId;

    // 중복 보상 확인
    const existingClaim = await this.claimRepository.findByUserAndEvent(userId, eventId);

    if (existingClaim) {
      this.logger.warn(`중복 보상 시도: 사용자 ${userId}, 이벤트 ${eventId}`);
      throw new DuplicateClaimException();
    }

    // 이벤트 조건 검증
    const validationResult = await this.eventValidatorService.validateEvent(userId, eventId);

    if (!validationResult.isValid) {
      this.logger.warn(`이벤트 조건 불충족: 사용자 ${userId}, 이벤트 ${eventId}, 사유: ${validationResult.errorMessage}`);
      throw new EventConditionNotMetException(validationResult.errorMessage);
    }

    // 보상 청구 생성
    const claim = await this.claimRepository.create({
      userId,
      rewardId,
      eventId,
      status: 'pending',
      claimedAt: new Date(),
      validationMetadata: validationResult.metadata
    });

    this.logger.info(`보상 청구 성공: ${claim.id}`);

    return claim;
  }

  /**
   * 특정 사용자의 이벤트별 청구 여부를 확인합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @returns 청구 여부
   */
  async hasClaimedEvent(userId: string, eventId: string): Promise<boolean> {
    const claim = await this.claimRepository.findByUserAndEvent(userId, eventId);
    return !!claim;
  }

  /**
   * 특정 사용자의 보상 청구 목록을 조회합니다.
   * 
   * @param userId 사용자 ID
   * @returns 청구 목록
   */
  async findByUser(userId: string) {
    this.logger.debug(`사용자 ${userId}의 보상 청구 목록 조회`);
    return this.claimRepository.findByUserId(userId);
  }

  /**
   * 모든 보상 청구 목록을 조회합니다.
   * 
   * @param page 페이지 번호
   * @param limit 페이지 크기
   * @param filter 필터링 조건
   * @returns 페이지네이션된 청구 목록
   */
  async findAll(page = 1, limit = 10, filter: any = {}) {
    this.logger.debug(`보상 청구 목록 조회: 페이지 ${page}, 크기 ${limit}, 필터: ${JSON.stringify(filter)}`);
    return this.claimRepository.findAll(page, limit, filter);
  }

  /**
   * 특정 보상 청구 상태를 업데이트합니다.
   * 
   * @param id 청구 ID
   * @param status 새로운 상태
   * @param processedBy 처리자 ID
   * @returns 업데이트된 청구 정보
   */
  async updateStatus(id: string, status: string, processedBy?: string) {
    this.logger.debug(`청구 상태 업데이트: ${id}, 새 상태: ${status}, 처리자: ${processedBy || 'system'}`);

    const updateData: any = {
      status,
      processedAt: new Date()
    };

    if (processedBy) {
      updateData.processedBy = processedBy;
    }

    return this.claimRepository.updateStatus(id, updateData);
  }
} 