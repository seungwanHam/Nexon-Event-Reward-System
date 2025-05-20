export enum ClaimStatus {
  PENDING = 'pending',     // 승인 대기 중
  APPROVED = 'approved',   // 승인됨
  REJECTED = 'rejected',   // 거부됨
  COMPLETED = 'completed', // 완료됨 (보상 지급 완료)
} 