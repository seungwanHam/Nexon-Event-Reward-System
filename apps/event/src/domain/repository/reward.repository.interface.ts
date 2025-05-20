import { RewardEntity } from '../entity/reward.entity';

export const REWARD_REPOSITORY = 'REWARD_REPOSITORY';

export interface RewardRepository {
  findById(id: string): Promise<RewardEntity>;
  findByEventId(eventId: string): Promise<RewardEntity[]>;
  findAll(filter?: Partial<RewardEntity>): Promise<RewardEntity[]>;
  save(reward: RewardEntity): Promise<void>;
  delete(id: string): Promise<void>;
} 