/**
 * 이벤트 검증 결과
 */
export interface ValidationResult {
  /**
   * 검증 통과 여부
   */
  isValid: boolean;

  /**
   * 오류 메시지 (실패 시)
   */
  errorMessage?: string;

  /**
   * 검증 과정에서 수집된 메타데이터
   */
  metadata?: Record<string, any>;
}

/**
 * 이벤트 검증기 인터페이스
 * 
 * 다양한 이벤트 타입에 대한 조건 검증 로직을 정의합니다.
 */
export interface EventValidator {
  /**
   * 이벤트 조건 충족 여부를 검증합니다.
   * 
   * @param userId 사용자 ID
   * @param eventId 이벤트 ID
   * @param eventConfig 이벤트 설정
   * @returns 검증 결과
   */
  validate(userId: string, eventId: string, eventConfig: any): Promise<ValidationResult>;
} 