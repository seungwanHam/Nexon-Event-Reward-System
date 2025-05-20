import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardClaimEntity } from '../../domain/entity/reward-claim.entity';
import { RewardClaimRepository } from '../../domain/repository/reward-claim.repository.interface';
import { ClaimStatus } from '@app/libs/common/enum';
import { RewardClaimDocument, RewardClaimModel } from '@app/libs/infrastructure/database/schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RewardClaimRepositoryImpl implements RewardClaimRepository {
  constructor(
    @InjectModel(RewardClaimModel.name) private claimModel: Model<RewardClaimDocument>,
  ) {}

  async findById(id: string): Promise<RewardClaimEntity | null> {
    const claim = await this.claimModel.findOne({ id }).exec();
    return claim ? this.mapToEntity(claim) : null;
  }

  async findByUserId(userId: string): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ userId }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async findByEventId(eventId: string): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ eventId }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async findByRewardId(rewardId: string): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ rewardId }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async findByUserAndEvent(userId: string, eventId: string): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ userId, eventId }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async findByUserAndReward(userId: string, rewardId: string): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ userId, rewardId }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async findByStatus(status: ClaimStatus): Promise<RewardClaimEntity[]> {
    const claims = await this.claimModel.find({ status }).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async findAll(page?: number, limit?: number, filter?: any): Promise<RewardClaimEntity[]> {
    if (page && limit) {
      const skip = (page - 1) * limit;
      const query = filter ? this.buildQuery(filter) : {};
      const claims = await this.claimModel.find(query)
        .skip(skip)
        .limit(limit)
        .exec();
      return claims.map(claim => this.mapToEntity(claim));
    }
    
    const query = filter ? this.buildQuery(filter) : {};
    const claims = await this.claimModel.find(query).exec();
    return claims.map(claim => this.mapToEntity(claim));
  }

  async save(claim: RewardClaimEntity): Promise<RewardClaimEntity> {
    const claimDoc = this.mapToDocument(claim);

    if (!claimDoc.id) {
      claimDoc.id = uuidv4();
    }

    await this.claimModel.updateOne(
      { id: claimDoc.id },
      claimDoc,
      { upsert: true }
    ).exec();
    
    const updatedClaim = await this.claimModel.findOne({ id: claimDoc.id }).exec();
    return this.mapToEntity(updatedClaim);
  }

  async delete(id: string): Promise<void> {
    await this.claimModel.deleteOne({ id }).exec();
  }

  async create(data: any): Promise<RewardClaimEntity> {
    const claimDoc = await this.claimModel.create(data);
    return this.mapToEntity(claimDoc);
  }

  async updateStatus(id: string, updateData: any): Promise<RewardClaimEntity> {
    await this.claimModel.updateOne(
      { _id: id },
      { $set: updateData }
    );
    const updatedDoc = await this.claimModel.findById(id);
    return this.mapToEntity(updatedDoc);
  }

  private buildQuery(filter: Partial<RewardClaimEntity>): Record<string, any> {
    const query: Record<string, any> = {};
    
    if (filter.id) query.id = filter.id;
    if (filter.userId) query.userId = filter.userId;
    if (filter.eventId) query.eventId = filter.eventId;
    if (filter.rewardId) query.rewardId = filter.rewardId;
    if (filter.status) query.status = filter.status;
    
    return query;
  }

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

  private mapToDocument(entity: RewardClaimEntity): Record<string, any> {
    return {
      id: entity.id,
      userId: entity.userId,
      eventId: entity.eventId,
      rewardId: entity.rewardId,
      status: entity.status,
      requestDate: entity.requestDate,
      processDate: entity.processDate,
      approverId: entity.approverId,
      rejectionReason: entity.rejectionReason,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
