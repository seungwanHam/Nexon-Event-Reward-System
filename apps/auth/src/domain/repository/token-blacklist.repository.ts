/**
 * 토큰 블랙리스트 저장소 인터페이스
 */
export interface TokenBlacklistRepository {
  /**
   * 토큰을 블랙리스트에 추가합니다
   * @param token 블랙리스트에 추가할 토큰
   * @param expiryInSeconds 토큰의 남은 유효 시간 (초)
   * @throws {InvalidTokenException} 토큰이 이미 블랙리스트에 있는 경우
   */
  addToBlacklist(token: string, expiryInSeconds: number): Promise<void>;

  /**
   * 토큰이 블랙리스트에 있는지 확인합니다
   * @param token 확인할 토큰
   * @returns 블랙리스트에 있으면 true, 없으면 false
   */
  isBlacklisted(token: string): Promise<boolean>;

  /**
   * 만료된 토큰을 블랙리스트에서 제거합니다
   * @returns 제거된 토큰의 수
   */
  cleanupExpiredTokens(): Promise<number>;

  /**
   * 특정 사용자의 모든 토큰을 블랙리스트에 추가합니다
   * @param userId 사용자 ID
   * @param expiryInSeconds 토큰의 남은 유효 시간 (초)
   */
  blacklistUserTokens(userId: string, expiryInSeconds: number): Promise<void>;

  /**
   * 블랙리스트에 있는 토큰의 개수를 반환합니다
   * @returns 블랙리스트에 있는 토큰의 총 개수
   */
  getBlacklistSize(): Promise<number>;
} 