import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RewardEntity } from '../../domain/entity/reward.entity';
import { RewardRepository } from '../../domain/repository/reward.repository.interface';
import { RewardDocument, RewardModel } from '@app/libs/infrastructure/database/schema';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class RewardRepositoryImpl implements RewardRepository {
  constructor(
    @InjectModel(RewardModel.name) private rewardModel: Model<RewardDocument>,
  ) { }

  async findById(id: string): Promise<RewardEntity | null> {
    const reward = await this.rewardModel.findOne({ id }).exec();
    return reward ? this.mapToEntity(reward) : null;
  }

  async findByEventId(eventId: string): Promise<RewardEntity[]> {
    const rewards = await this.rewardModel.find({ eventId }).exec();
    return rewards.map(reward => this.mapToEntity(reward));
  }

  async findAll(filter?: Partial<RewardEntity>): Promise<RewardEntity[]> {
    const query = filter ? this.buildQuery(filter) : {};
    const rewards = await this.rewardModel.find(query).exec();
    return rewards.map(reward => this.mapToEntity(reward));
  }

  async save(reward: RewardEntity): Promise<void> {
    const rewardDoc = this.mapToDocument(reward);

    if (!rewardDoc.id) {
      rewardDoc.id = uuidv4();
    }

    await this.rewardModel.updateOne(
      { id: rewardDoc.id },
      rewardDoc,
      { upsert: true }
    ).exec();
  }

  async delete(id: string): Promise<void> {
    await this.rewardModel.deleteOne({ id }).exec();
  }

  private buildQuery(filter: Partial<RewardEntity>): Record<string, any> {
    const query: Record<string, any> = {};

    if (filter.id) query.id = filter.id;
    if (filter.eventId) query.eventId = filter.eventId;
    if (filter.type) query.type = filter.type;

    return query;
  }

  private mapToEntity(doc: RewardDocument): RewardEntity {
    return RewardEntity.create({
      id: doc.id,
      eventId: doc.eventId,
      type: doc.type,
      amount: doc.amount,
      description: doc.description,
      requiresApproval: doc.requiresApproval,
      metadata: doc.metadata,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    });
  }

  private mapToDocument(entity: RewardEntity): Record<string, any> {
    return {
      id: entity.id,
      eventId: entity.eventId,
      type: entity.type,
      amount: entity.amount,
      description: entity.description,
      requiresApproval: entity.requiresApproval,
      metadata: entity.metadata,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}
