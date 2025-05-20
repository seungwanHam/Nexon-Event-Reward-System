import { Injectable, Inject } from '@nestjs/common';
import { RewardEntity } from '../entity/reward.entity';
import { REWARD_REPOSITORY, RewardRepository } from '../repository/reward.repository.interface';
import { EVENT_REPOSITORY, EventRepository } from '../repository/event.repository.interface';
import { RewardType } from '@app/libs/common/enum';
import { EventNotFoundException, NotFoundException } from '@app/libs/common/exception';

@Injectable()
export class RewardService {
  constructor(
    @Inject(REWARD_REPOSITORY)
    private readonly rewardRepository: RewardRepository,
    @Inject(EVENT_REPOSITORY)
    private readonly eventRepository: EventRepository,
  ) {}

  /**
   * 새 보상을 생성합니다.
   */
  async createReward(
    eventId: string,
    type: RewardType,
    amount: number,
    description: string,
    requiresApproval: boolean = false,
    metadata?: Record<string, any>,
  ): Promise<RewardEntity> {
    // 이벤트 존재 확인
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    const reward = RewardEntity.create({
      eventId,
      type,
      amount,
      description,
      requiresApproval,
      metadata,
    });

    await this.rewardRepository.save(reward);
    return reward;
  }

  /**
   * 이벤트에 연결된 모든 보상을 조회합니다.
   */
  async findRewardsByEventId(eventId: string): Promise<RewardEntity[]> {
    // 이벤트 존재 확인
    const event = await this.eventRepository.findById(eventId);
    if (!event) {
      throw new EventNotFoundException();
    }

    return this.rewardRepository.findByEventId(eventId);
  }

  /**
   * 모든 보상을 조회합니다.
   */
  async findAllRewards(): Promise<RewardEntity[]> {
    return this.rewardRepository.findAll();
  }

  /**
   * ID로 보상을 조회합니다.
   */
  async findRewardById(id: string): Promise<RewardEntity> {
    const reward = await this.rewardRepository.findById(id);
    if (!reward) {
      throw new NotFoundException('보상을 찾을 수 없습니다.');
    }
    return reward;
  }

  /**
   * ID로 보상을 조회합니다. findRewardById와 동일한 기능을 하는 alias입니다.
   */
  async findById(id: string): Promise<RewardEntity> {
    return this.findRewardById(id);
  }

  /**
   * 보상을 업데이트합니다.
   */
  async updateReward(
    id: string,
    updateData: Partial<Omit<RewardEntity, 'id' | 'eventId' | 'createdAt'>>
  ): Promise<RewardEntity> {
    const reward = await this.findRewardById(id);
    reward.update(updateData);
    await this.rewardRepository.save(reward);
    return reward;
  }

  /**
   * 보상을 삭제합니다.
   */
  async deleteReward(id: string): Promise<void> {
    await this.findRewardById(id); // 존재 확인
    await this.rewardRepository.delete(id);
  }
} 