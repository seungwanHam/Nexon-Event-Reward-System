import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardClaimDocument, RewardClaimModel } from '@app/libs/infrastructure/database/schema';
import { RewardClaimEntity } from '../../domain/entity/reward-claim.entity';

/**
 * 보상 청구 저장소 구현체
 */
@Injectable()
export class ClaimRepository {
  constructor(
    @InjectModel(RewardClaimModel.name) private claimModel: Model<RewardClaimDocument>,
  ) {}

  /**
   * ID로 보상 청구를 조회합니다.
   */
  async findById(id: string): Promise<RewardClaimEntity | null> {
    const claim = await this.claimModel.findOne({ id }).exec();
    return claim ? this.mapToEntity(claim) : null;
  }

  /**
   * 사용자 ID로 보상 청구 목록을 조회합니다.
   */
  async findByUser(userId: string): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ userId }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  /**
   * 새로운 보상 청구를 생성합니다.
   */
  async create(data: any): Promise<RewardClaimEntity> {
    const newClaim = await this.claimModel.create({
      ...data,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    return this.mapToEntity(newClaim);
  }

  /**
   * 보상 청구 상태를 업데이트합니다.
   */
  async updateStatus(id: string, updateData: any): Promise<RewardClaimEntity> {
    await this.claimModel.updateOne(
      { id },
      { 
        $set: { 
          ...updateData, 
          updatedAt: new Date() 
        } 
      }
    ).exec();
    
    const updated = await this.claimModel.findOne({ id }).exec();
    return this.mapToEntity(updated);
  }

  /**
   * 페이지네이션을 적용하여 보상 청구 목록을 조회합니다.
   */
  async findAll(page: number = 1, limit: number = 10, filter: any = {}): Promise<RewardClaimEntity[]> {
    const skip = (page - 1) * limit;
    const claims = await this.claimModel.find(filter)
      .skip(skip)
      .limit(limit)
      .exec();
    
    return claims.map(claim => this.mapToEntity(claim));
  }

  /**
   * 특정 사용자와 이벤트의 보상 청구 내역을 조회합니다.
   */
  async findByUserAndEvent(userId: string, eventId: string): Promise<RewardClaimEntity | null> {
    const claim = await this.claimModel.findOne({ userId, eventId }).exec();
    return claim ? this.mapToEntity(claim) : null;
  }

  /**
   * 문서를 엔티티로 변환합니다.
   */
  private mapToEntity(doc: RewardClaimDocument): RewardClaimEntity {
    return RewardClaimEntity.create({
      id: doc.id,
      userId: doc.userId,
      eventId: doc.eventId,
      rewardId: doc.rewardId,
      status: doc.status,
      requestDate: doc.requestDate,
      processDate: doc.processDate,
      approverId: doc.approverId,
      rejectionReason: doc.rejectionReason,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }
} 