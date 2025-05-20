export enum ConditionType {
  LOGIN = 'login',                    // 단순 로그인 이벤트 (1회 로그인)
  DAILY_LOGIN = 'daily_login',        // 매일 로그인 이벤트 (연속 N일 로그인)
  INVITE = 'invite',                  // 친구 초대 이벤트 (N명 초대)
  QUEST = 'quest',                    // 퀘스트 완료 이벤트 (특정 퀘스트 완료)
  PURCHASE = 'purchase',              // 구매 이벤트 (특정 금액 이상 구매)
  PLAYTIME = 'playtime',              // 플레이타임 이벤트 (특정 시간 동안 플레이)
  LEVEL = 'level',                    // 레벨 달성 이벤트 (특정 레벨 달성)
  CUSTOM = 'custom',                  // 커스텀 이벤트 (사용자 정의 조건)
} 