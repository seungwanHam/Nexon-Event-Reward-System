import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WinstonLoggerService } from '@app/libs/infrastructure/logger';

/**
 * 사용자 로그인 기록 스키마 인터페이스
 */
export interface UserLogin {
  userId: string;
  loginAt: Date;
  deviceInfo?: string;
  ipAddress?: string;
}

/**
 * 사용자 로그인 기록 저장소
 */
@Injectable()
export class UserLoginRepository {
  constructor(
    @InjectModel('UserLogin') private userLoginModel: Model<UserLogin>,
    private readonly logger: WinstonLoggerService,
  ) {
    this.logger.setContext('UserLoginRepository');
  }

  /**
   * 사용자의 총 로그인 횟수를 조회합니다.
   * 
   * @param userId 사용자 ID
   * @returns 총 로그인 횟수
   */
  async getTotalLoginCount(userId: string): Promise<number> {
    this.logger.debug(`사용자 ${userId}의 총 로그인 횟수 조회`);
    
    try {
      return await this.userLoginModel.countDocuments({ userId });
    } catch (error) {
      this.logger.error(`사용자 ${userId}의 로그인 횟수 조회 중 오류: ${error.message}`);
      return 0;
    }
  }

  /**
   * 사용자의 연속 로그인 일수를 계산합니다.
   * 
   * @param userId 사용자 ID
   * @returns 연속 로그인 일수
   */
  async getConsecutiveLoginDays(userId: string): Promise<number> {
    this.logger.debug(`사용자 ${userId}의 연속 로그인 일수 계산`);
    
    try {
      // 최근 30일간의 로그인 기록 조회
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const logins = await this.userLoginModel.find({
        userId,
        loginAt: { $gte: thirtyDaysAgo }
      }).sort({ loginAt: -1 }).exec();
      
      if (logins.length === 0) {
        return 0;
      }
      
      // 오늘 로그인했는지 확인
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const hasLoginToday = logins.some(login => {
        const loginDate = new Date(login.loginAt);
        loginDate.setHours(0, 0, 0, 0);
        return loginDate.getTime() === today.getTime();
      });
      
      if (!hasLoginToday) {
        return 0; // 오늘 로그인하지 않았으면 연속 로그인 중단
      }
      
      // 연속 로그인 일수 계산
      let consecutiveDays = 1; // 오늘 포함
      const processedDates = new Set<string>();
      
      // 오늘 날짜 추가
      processedDates.add(today.toISOString().split('T')[0]);
      
      for (let i = 1; i <= 30; i++) {
        const checkDate = new Date();
        checkDate.setDate(checkDate.getDate() - i);
        checkDate.setHours(0, 0, 0, 0);
        
        const dateString = checkDate.toISOString().split('T')[0];
        
        // 이미 처리한 날짜는 건너뛰기
        if (processedDates.has(dateString)) {
          continue;
        }
        
        const hasLoginOnDate = logins.some(login => {
          const loginDate = new Date(login.loginAt);
          loginDate.setHours(0, 0, 0, 0);
          return loginDate.getTime() === checkDate.getTime();
        });
        
        if (hasLoginOnDate) {
          consecutiveDays++;
          processedDates.add(dateString);
        } else {
          break; // 연속 로그인 중단
        }
      }
      
      return consecutiveDays;
    } catch (error) {
      this.logger.error(`사용자 ${userId}의 연속 로그인 일수 계산 중 오류: ${error.message}`);
      return 0;
    }
  }

  /**
   * 사용자 로그인 정보를 기록합니다.
   * 
   * @param userId 사용자 ID
   * @param deviceInfo 기기 정보 (선택)
   * @param ipAddress IP 주소 (선택)
   * @returns 저장된 로그인 기록
   */
  async recordLogin(userId: string, deviceInfo?: string, ipAddress?: string): Promise<UserLogin> {
    this.logger.debug(`사용자 ${userId} 로그인 기록`);
    
    try {
      const loginRecord = new this.userLoginModel({
        userId,
        loginAt: new Date(),
        deviceInfo,
        ipAddress
      });
      
      return await loginRecord.save();
    } catch (error) {
      this.logger.error(`사용자 ${userId} 로그인 기록 중 오류: ${error.message}`);
      throw error;
    }
  }
} 