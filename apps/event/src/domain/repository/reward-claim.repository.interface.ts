import { RewardClaimEntity } from '../entity/reward-claim.entity';
import { ClaimStatus } from '@app/libs/common/enum';

export const REWARD_CLAIM_REPOSITORY = 'REWARD_CLAIM_REPOSITORY';

export interface RewardClaimRepository {
  findById(id: string): Promise<RewardClaimEntity>;
  findByUserId(userId: string): Promise<RewardClaimEntity[]>;
  findByEventId(eventId: string): Promise<RewardClaimEntity[]>;
  findByRewardId(rewardId: string): Promise<RewardClaimEntity[]>;
  findByUserAndEvent(userId: string, eventId: string): Promise<RewardClaimEntity[]>;
  findByUserAndReward(userId: string, rewardId: string): Promise<RewardClaimEntity[]>;
  findByStatus(status: ClaimStatus): Promise<RewardClaimEntity[]>;
  findAll(page?: number, limit?: number, filter?: any): Promise<RewardClaimEntity[]>;
  save(claim: RewardClaimEntity): Promise<RewardClaimEntity>;
  delete(id: string): Promise<void>;
  create(data: any): Promise<RewardClaimEntity>;
  updateStatus(id: string, updateData: any): Promise<RewardClaimEntity>;
} 