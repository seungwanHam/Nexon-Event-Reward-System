import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

/**
 * 친구 초대 기록 스키마 인터페이스
 */
export interface Invite {
  inviterId: string;
  inviteeId: string;
  invitedAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  acceptedAt?: Date;
}

/**
 * 친구 초대 기록 저장소
 */
@Injectable()
export class InviteRepository {
  constructor(
    @InjectModel('Invite') private inviteModel: Model<Invite>,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('InviteRepository');
  }

  /**
   * 사용자가 보낸 초대 중 수락된 초대 수를 조회합니다.
   * 
   * @param userId 사용자 ID (초대자)
   * @returns 수락된 초대 수
   */
  async getInviteCount(userId: string): Promise<number> {
    this.logger.debug(`사용자 ${userId}의 수락된 초대 수 조회`);
    
    try {
      return await this.inviteModel.countDocuments({
        inviterId: userId,
        status: 'accepted'
      });
    } catch (error) {
      this.logger.error(`사용자 ${userId}의 초대 수 조회 중 오류: ${error.message}`);
      return 0;
    }
  }

  /**
   * 사용자가 초대한 모든 친구 기록을 조회합니다.
   * 
   * @param userId 사용자 ID (초대자)
   * @returns 초대 기록 목록
   */
  async getInvites(userId: string): Promise<Invite[]> {
    this.logger.debug(`사용자 ${userId}의 모든 초대 기록 조회`);
    
    try {
      return await this.inviteModel.find({ inviterId: userId }).sort({ invitedAt: -1 }).exec();
    } catch (error) {
      this.logger.error(`사용자 ${userId}의 초대 기록 조회 중 오류: ${error.message}`);
      return [];
    }
  }

  /**
   * 새로운 친구 초대를 기록합니다.
   * 
   * @param inviterId 초대자 ID
   * @param inviteeId 초대받은 사용자 ID
   * @returns 저장된 초대 기록
   */
  async createInvite(inviterId: string, inviteeId: string): Promise<Invite> {
    this.logger.debug(`새로운 초대 기록: 초대자 ${inviterId}, 초대받은 사용자 ${inviteeId}`);
    
    try {
      // 이미 초대한 기록이 있는지 확인
      const existingInvite = await this.inviteModel.findOne({
        inviterId,
        inviteeId
      });
      
      if (existingInvite) {
        this.logger.debug(`이미 초대한 기록이 있음: ${existingInvite.id}`);
        return existingInvite;
      }
      
      const invite = new this.inviteModel({
        inviterId,
        inviteeId,
        invitedAt: new Date(),
        status: 'pending'
      });
      
      return await invite.save();
    } catch (error) {
      this.logger.error(`초대 기록 저장 중 오류: ${error.message}`);
      throw error;
    }
  }

  /**
   * 초대 상태를 업데이트합니다.
   * 
   * @param inviteId 초대 ID
   * @param status 새로운 상태
   * @returns 업데이트된 초대 기록
   */
  async updateInviteStatus(inviteId: string, status: 'accepted' | 'rejected'): Promise<Invite> {
    this.logger.debug(`초대 상태 업데이트: ${inviteId}, 새로운 상태: ${status}`);
    
    try {
      const updateData: any = { status };
      
      if (status === 'accepted') {
        updateData.acceptedAt = new Date();
      }
      
      return await this.inviteModel.findByIdAndUpdate(
        inviteId,
        updateData,
        { new: true }
      );
    } catch (error) {
      this.logger.error(`초대 상태 업데이트 중 오류: ${error.message}`);
      throw error;
    }
  }
} 