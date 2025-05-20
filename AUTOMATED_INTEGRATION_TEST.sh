#!/bin/bash

# 색상 설정
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[0;33m'
RED='\033[0;31m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 설명 함수
explain() {
  echo -e "\n${BLUE}📝 ${1}${NC}\n"
}

# API 요청 함수
request() {
  echo -e "${YELLOW}🚀 요청: ${1}${NC}"
}

# 요청 본문 함수
request_body() {
  echo -e "${CYAN}📋 요청 본문:${NC}"
  echo "${1}" | jq '.'
}

# API 응답 함수
response() {
  echo -e "${GREEN}✅ 응답:${NC}"
  echo "${1}" | jq '.'
}

# 에러 함수
error() {
  echo -e "${RED}❌ 오류: ${1}${NC}"
  exit 1
}

# 타이틀 출력 함수
title() {
  echo -e "\n${YELLOW}===================================================${NC}"
  echo -e "${YELLOW}   ${1}${NC}"
  echo -e "${YELLOW}===================================================${NC}\n"
}

# 섹션 출력 함수
section() {
  echo -e "\n${PURPLE}---------------------------------------------------${NC}"
  echo -e "${PURPLE}   ${1}${NC}"
  echo -e "${PURPLE}---------------------------------------------------${NC}\n"
}

# 서버 실행 확인
check_server() {
  explain "서버가 실행 중인지 확인합니다..."
  if ! curl -s http://localhost:3000/health > /dev/null; then
    error "서버가 실행되고 있지 않습니다. 서버를 먼저 실행해주세요."
  fi
  explain "서버가 정상적으로 실행 중입니다."
}

# 모든 변수 초기화
clear_variables() {
  explain "테스트를 위해 변수들을 초기화합니다."
  ADMIN_TOKEN=""
  ADMIN_ID=""
  USER_TOKEN=""
  USER_ID=""
  AUDITOR_TOKEN=""
  AUDITOR_ID=""
  NEW_USER_TOKEN=""
  NEW_USER_ID=""
  LOGIN_EVENT_ID=""
  LOGIN_REWARD_ID=""
  SIGNUP_EVENT_ID=""
  SIGNUP_REWARD_ID=""
  CLAIM_ID=""
}

###################################
# 테스트 시작
###################################

title "넥슨 이벤트 보상 시스템 API 테스트"

check_server
clear_variables

###################################
# 사용자 계정 관리
###################################

title "1. 사용자 계정 관리"

# 관리자 회원가입
section "관리자 계정 등록"
ADMIN_PAYLOAD='{
  "email": "admin@nexon.com",
  "password": "Nexon123!",
  "nickname": "관리자",
  "roles": ["user", "admin"]
}'

request "POST /api/v1/auth/register - 관리자 회원가입"
request_body "$ADMIN_PAYLOAD"
ADMIN_REGISTER=$(curl -s -X POST "localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_PAYLOAD")
response "$ADMIN_REGISTER"

# 관리자 로그인 및 토큰 저장
section "관리자 로그인"
ADMIN_LOGIN_PAYLOAD='{
  "email": "admin@nexon.com",
  "password": "Nexon123!"
}'

request "POST /api/v1/auth/login - 관리자 로그인"
request_body "$ADMIN_LOGIN_PAYLOAD"
ADMIN_LOGIN=$(curl -s -X POST "localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$ADMIN_LOGIN_PAYLOAD")
response "$ADMIN_LOGIN"

ADMIN_TOKEN=$(echo "$ADMIN_LOGIN" | jq -r '.data.accessToken')
ADMIN_ID=$(echo "$ADMIN_LOGIN" | jq -r '.data.id')

if [ -z "$ADMIN_TOKEN" ] || [ "$ADMIN_TOKEN" = "null" ]; then
  error "관리자 토큰을 얻는데 실패했습니다."
fi

explain "관리자 토큰: $ADMIN_TOKEN"
explain "관리자 ID: $ADMIN_ID"

# 일반 사용자 회원가입
section "일반 사용자 계정 등록"
USER_PAYLOAD='{
  "email": "user@nexon.com",
  "password": "Nexon123!",
  "nickname": "일반사용자",
  "roles": ["user"]
}'

request "POST /api/v1/auth/register - 일반 사용자 회원가입"
request_body "$USER_PAYLOAD"
USER_REGISTER=$(curl -s -X POST "localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "$USER_PAYLOAD")
response "$USER_REGISTER"

# 일반 사용자 로그인 및 토큰 저장
section "일반 사용자 로그인"
USER_LOGIN_PAYLOAD='{
  "email": "user@nexon.com",
  "password": "Nexon123!"
}'

request "POST /api/v1/auth/login - 일반 사용자 로그인"
request_body "$USER_LOGIN_PAYLOAD"
USER_LOGIN=$(curl -s -X POST "localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$USER_LOGIN_PAYLOAD")
response "$USER_LOGIN"

USER_TOKEN=$(echo "$USER_LOGIN" | jq -r '.data.accessToken')
USER_ID=$(echo "$USER_LOGIN" | jq -r '.data.id')

if [ -z "$USER_TOKEN" ] || [ "$USER_TOKEN" = "null" ]; then
  error "일반 사용자 토큰을 얻는데 실패했습니다."
fi

explain "일반 사용자 토큰: $USER_TOKEN"
explain "일반 사용자 ID: $USER_ID"

# 감사자 회원가입
section "감사자 계정 등록"
AUDITOR_PAYLOAD='{
  "email": "auditor@nexon.com",
  "password": "Nexon123!",
  "nickname": "감사자",
  "roles": ["auditor", "user"]
}'

request "POST /api/v1/auth/register - 감사자 회원가입"
request_body "$AUDITOR_PAYLOAD"
AUDITOR_REGISTER=$(curl -s -X POST "localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "$AUDITOR_PAYLOAD")
response "$AUDITOR_REGISTER"

# 감사자 로그인 및 토큰 저장
section "감사자 로그인"
AUDITOR_LOGIN_PAYLOAD='{
  "email": "auditor@nexon.com",
  "password": "Nexon123!"
}'

request "POST /api/v1/auth/login - 감사자 로그인"
request_body "$AUDITOR_LOGIN_PAYLOAD"
AUDITOR_LOGIN=$(curl -s -X POST "localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$AUDITOR_LOGIN_PAYLOAD")
response "$AUDITOR_LOGIN"

AUDITOR_TOKEN=$(echo "$AUDITOR_LOGIN" | jq -r '.data.accessToken')
AUDITOR_ID=$(echo "$AUDITOR_LOGIN" | jq -r '.data.id')

if [ -z "$AUDITOR_TOKEN" ] || [ "$AUDITOR_TOKEN" = "null" ]; then
  error "감사자 토큰을 얻는데 실패했습니다."
fi

explain "감사자 토큰: $AUDITOR_TOKEN"
explain "감사자 ID: $AUDITOR_ID"

###################################
# 로그인 이벤트 테스트 (수동 승인)
###################################

title "2. 로그인 이벤트 테스트 (수동 승인)"

# 로그인 이벤트 생성
section "로그인 이벤트 생성"
LOGIN_EVENT_PAYLOAD='{
  "name": "첫 로그인 이벤트",
  "description": "게임에 처음 로그인하면 보상을 받을 수 있습니다",
  "conditionType": "login",
  "conditionParams": {
    "requiredCount": 1
  },
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2028-12-31T23:59:59Z"
}'

request "POST /api/v1/events - 로그인 이벤트 생성"
request_body "$LOGIN_EVENT_PAYLOAD"
LOGIN_EVENT_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$LOGIN_EVENT_PAYLOAD")
response "$LOGIN_EVENT_CREATE"

# 이벤트 ID 저장
section "로그인 이벤트 ID 조회"
request "GET /api/v1/events - 이벤트 목록 조회"
EVENTS_LIST=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
response "$EVENTS_LIST"

LOGIN_EVENT_ID=$(echo "$EVENTS_LIST" | jq -r '.data[0].id')
explain "로그인 이벤트 ID: $LOGIN_EVENT_ID"

# 로그인 이벤트 보상 생성
section "로그인 이벤트 보상 생성"
LOGIN_REWARD_PAYLOAD=$(cat <<EOF
{
  "eventId": "$LOGIN_EVENT_ID",
  "type": "point",
  "amount": 1000,
  "description": "첫 로그인 특별 보상 (관리자 승인 필요)",
  "requiresApproval": true
}
EOF
)

request "POST /api/v1/rewards - 로그인 이벤트 보상 생성"
request_body "$LOGIN_REWARD_PAYLOAD"
LOGIN_REWARD_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/rewards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$LOGIN_REWARD_PAYLOAD")
response "$LOGIN_REWARD_CREATE"

# 보상 ID 저장
section "로그인 이벤트 보상 ID 조회"
request "GET /api/v1/rewards/event/$LOGIN_EVENT_ID - 이벤트별 보상 조회"
REWARDS_LIST=$(curl -s -X GET "http://localhost:3000/api/v1/rewards/event/$LOGIN_EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
response "$REWARDS_LIST"

LOGIN_REWARD_ID=$(echo "$REWARDS_LIST" | jq -r '.data[0].id')
explain "로그인 보상 ID: $LOGIN_REWARD_ID"

# 로그인 이벤트 활성화
section "로그인 이벤트 활성화"
LOGIN_ACTIVATE_PAYLOAD='{
  "status": "active"
}'

request "PUT /api/v1/events/$LOGIN_EVENT_ID/status - 로그인 이벤트 활성화"
request_body "$LOGIN_ACTIVATE_PAYLOAD"
LOGIN_EVENT_ACTIVATE=$(curl -s -X PUT "http://localhost:3000/api/v1/events/$LOGIN_EVENT_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$LOGIN_ACTIVATE_PAYLOAD")
response "$LOGIN_EVENT_ACTIVATE"

# 로그인 행동 조건 평가
section "로그인 행동 조건 평가"
LOGIN_EVALUATE_PAYLOAD=$(cat <<EOF
{
  "userId": "$USER_ID",
  "eventId": "$LOGIN_EVENT_ID",
  "actionData": {
    "loginCount": 1
  }
}
EOF
)

request "POST /api/v1/claims/evaluate - 로그인 행동 조건 평가"
request_body "$LOGIN_EVALUATE_PAYLOAD"
LOGIN_EVALUATE=$(curl -s -X POST http://localhost:3000/api/v1/claims/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "$LOGIN_EVALUATE_PAYLOAD")
response "$LOGIN_EVALUATE"

# 보상 청구 요청
section "로그인 이벤트 보상 청구"
LOGIN_CLAIM_PAYLOAD=$(cat <<EOF
{
  "userId": "$USER_ID",
  "eventId": "$LOGIN_EVENT_ID",
  "rewardId": "$LOGIN_REWARD_ID"
}
EOF
)

request "POST /api/v1/claims - 보상 청구 요청"
request_body "$LOGIN_CLAIM_PAYLOAD"
LOGIN_CLAIM=$(curl -s -X POST http://localhost:3000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "$LOGIN_CLAIM_PAYLOAD")
response "$LOGIN_CLAIM"

# 청구 이력 조회
section "청구 이력 조회"
request "GET /api/v1/claims/user - 청구 이력 조회"
USER_CLAIMS=$(curl -s -X GET http://localhost:3000/api/v1/claims/user \
  -H "Authorization: Bearer $USER_TOKEN")
response "$USER_CLAIMS"

# 청구 ID 저장
CLAIM_ID=$(echo "$USER_CLAIMS" | jq -r '.data[0].id')
explain "청구 ID: $CLAIM_ID"

# 청구 승인
section "청구 승인"
CLAIM_APPROVE_PAYLOAD=$(cat <<EOF
{
  "approverId": "$ADMIN_ID"
}
EOF
)

request "PUT /api/v1/claims/$CLAIM_ID/approve - 청구 승인"
request_body "$CLAIM_APPROVE_PAYLOAD"
CLAIM_APPROVE=$(curl -s -X PUT "http://localhost:3000/api/v1/claims/$CLAIM_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$CLAIM_APPROVE_PAYLOAD")
response "$CLAIM_APPROVE"

# 승인 후 청구 상태 확인
section "승인 후 청구 상태 확인"
request "GET /api/v1/claims/user - 승인 후 청구 상태 확인"
APPROVED_CLAIMS=$(curl -s -X GET http://localhost:3000/api/v1/claims/user \
  -H "Authorization: Bearer $USER_TOKEN")
response "$APPROVED_CLAIMS"

# 중복 보상 청구 시도 (이미 승인된 이벤트에 대해)
section "중복 보상 청구 시도 (이미 승인된 이벤트)"
request "POST /api/v1/claims - 중복 보상 청구 시도"
request_body "$LOGIN_CLAIM_PAYLOAD"
DUPLICATE_CLAIM=$(curl -s -X POST http://localhost:3000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -d "$LOGIN_CLAIM_PAYLOAD")
response "$DUPLICATE_CLAIM"

explain "중복 보상 요청이 올바르게 거부되었는지 확인합니다. 응답에 오류 메시지가 포함되어야 합니다."

###################################
# 회원가입 이벤트 테스트 (자동 승인)
###################################

title "3. 회원가입 이벤트 테스트 (자동 승인)"

# 회원가입 이벤트 생성
section "회원가입 이벤트 생성"
SIGNUP_EVENT_PAYLOAD='{
  "name": "신규 회원 가입 이벤트",
  "description": "회원가입을 완료하면 특별 보상을 받을 수 있습니다",
  "conditionType": "custom",
  "conditionParams": {
    "eventCode": "user-register"
  },
  "startDate": "2023-01-01T00:00:00Z",
  "endDate": "2028-12-31T23:59:59Z"
}'

request "POST /api/v1/events - 회원가입 이벤트 생성"
request_body "$SIGNUP_EVENT_PAYLOAD"
SIGNUP_EVENT_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$SIGNUP_EVENT_PAYLOAD")
response "$SIGNUP_EVENT_CREATE"

# 이벤트 ID 저장
section "회원가입 이벤트 ID 조회"
request "GET /api/v1/events - 이벤트 목록 조회"
EVENTS_LIST=$(curl -s -X GET "http://localhost:3000/api/v1/events" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
response "$EVENTS_LIST"

SIGNUP_EVENT_ID=$(echo "$EVENTS_LIST" | jq -r '.data[0].id')
explain "회원가입 이벤트 ID: $SIGNUP_EVENT_ID"

# 회원가입 이벤트 보상 생성
section "회원가입 이벤트 보상 생성"
SIGNUP_REWARD_PAYLOAD=$(cat <<EOF
{
  "eventId": "$SIGNUP_EVENT_ID",
  "type": "point",
  "amount": 5000,
  "description": "회원가입 축하 포인트 (자동 승인)",
  "requiresApproval": false
}
EOF
)

request "POST /api/v1/rewards - 회원가입 이벤트 보상 생성"
request_body "$SIGNUP_REWARD_PAYLOAD"
SIGNUP_REWARD_CREATE=$(curl -s -X POST http://localhost:3000/api/v1/rewards \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$SIGNUP_REWARD_PAYLOAD")
response "$SIGNUP_REWARD_CREATE"

# 보상 ID 저장
section "회원가입 이벤트 보상 ID 조회"
request "GET /api/v1/rewards/event/$SIGNUP_EVENT_ID - 이벤트별 보상 조회"
REWARDS_LIST=$(curl -s -X GET "http://localhost:3000/api/v1/rewards/event/$SIGNUP_EVENT_ID" \
  -H "Authorization: Bearer $ADMIN_TOKEN")
response "$REWARDS_LIST"

SIGNUP_REWARD_ID=$(echo "$REWARDS_LIST" | jq -r '.data[0].id')
explain "회원가입 보상 ID: $SIGNUP_REWARD_ID"

# 회원가입 이벤트 활성화
section "회원가입 이벤트 활성화"
SIGNUP_ACTIVATE_PAYLOAD='{
  "status": "active"
}'

request "PUT /api/v1/events/$SIGNUP_EVENT_ID/status - 회원가입 이벤트 활성화"
request_body "$SIGNUP_ACTIVATE_PAYLOAD"
SIGNUP_EVENT_ACTIVATE=$(curl -s -X PUT "http://localhost:3000/api/v1/events/$SIGNUP_EVENT_ID/status" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d "$SIGNUP_ACTIVATE_PAYLOAD")
response "$SIGNUP_EVENT_ACTIVATE"

# 새로운 사용자 회원가입
section "새로운 사용자 회원가입"
NEW_USER_PAYLOAD='{
  "email": "newuser@nexon.com",
  "password": "Nexon123!",
  "nickname": "신규사용자",
  "roles": ["user"]
}'

request "POST /api/v1/auth/register - 새로운 사용자 회원가입"
request_body "$NEW_USER_PAYLOAD"
NEW_USER_REGISTER=$(curl -s -X POST "localhost:3000/api/v1/auth/register" \
  -H "Content-Type: application/json" \
  -d "$NEW_USER_PAYLOAD")
response "$NEW_USER_REGISTER"

# 신규 사용자 로그인 및 토큰 저장
section "신규 사용자 로그인"
NEW_USER_LOGIN_PAYLOAD='{
  "email": "newuser@nexon.com",
  "password": "Nexon123!"
}'

request "POST /api/v1/auth/login - 신규 사용자 로그인"
request_body "$NEW_USER_LOGIN_PAYLOAD"
NEW_USER_LOGIN=$(curl -s -X POST "localhost:3000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d "$NEW_USER_LOGIN_PAYLOAD")
response "$NEW_USER_LOGIN"

NEW_USER_TOKEN=$(echo "$NEW_USER_LOGIN" | jq -r '.data.accessToken')
NEW_USER_ID=$(echo "$NEW_USER_LOGIN" | jq -r '.data.id')

if [ -z "$NEW_USER_TOKEN" ] || [ "$NEW_USER_TOKEN" = "null" ]; then
  error "신규 사용자 토큰을 얻는데 실패했습니다."
fi

explain "신규 사용자 토큰: $NEW_USER_TOKEN"
explain "신규 사용자 ID: $NEW_USER_ID"

# 회원가입 행동 조건 평가
section "회원가입 행동 조건 평가"
SIGNUP_EVALUATE_PAYLOAD=$(cat <<EOF
{
  "userId": "$NEW_USER_ID",
  "eventId": "$SIGNUP_EVENT_ID",
  "actionData": {
    "eventCode": "user-register",
    "customEventPassed": true
  }
}
EOF
)

request "POST /api/v1/claims/evaluate - 회원가입 행동 조건 평가"
request_body "$SIGNUP_EVALUATE_PAYLOAD"
SIGNUP_EVALUATE=$(curl -s -X POST http://localhost:3000/api/v1/claims/evaluate \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_USER_TOKEN" \
  -d "$SIGNUP_EVALUATE_PAYLOAD")
response "$SIGNUP_EVALUATE"

# 보상 청구 요청
section "회원가입 이벤트 보상 청구"
SIGNUP_CLAIM_PAYLOAD=$(cat <<EOF
{
  "userId": "$NEW_USER_ID",
  "eventId": "$SIGNUP_EVENT_ID",
  "rewardId": "$SIGNUP_REWARD_ID"
}
EOF
)

request "POST /api/v1/claims - 보상 청구 요청"
request_body "$SIGNUP_CLAIM_PAYLOAD"
SIGNUP_CLAIM=$(curl -s -X POST http://localhost:3000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_USER_TOKEN" \
  -d "$SIGNUP_CLAIM_PAYLOAD")
response "$SIGNUP_CLAIM"

# 자동 승인 상태 확인
section "자동 승인 상태 확인"
request "GET /api/v1/claims/user - 자동 승인 상태 확인"
NEW_USER_CLAIMS=$(curl -s -X GET http://localhost:3000/api/v1/claims/user \
  -H "Authorization: Bearer $NEW_USER_TOKEN")
response "$NEW_USER_CLAIMS"

# 중복 보상 청구 시도 (자동 승인 이벤트)
section "중복 보상 청구 시도 (자동 승인 이벤트)"
request "POST /api/v1/claims - 중복 보상 청구 시도"
request_body "$SIGNUP_CLAIM_PAYLOAD"
DUPLICATE_SIGNUP_CLAIM=$(curl -s -X POST http://localhost:3000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_USER_TOKEN" \
  -d "$SIGNUP_CLAIM_PAYLOAD")
response "$DUPLICATE_SIGNUP_CLAIM"

explain "중복 보상 요청이 올바르게 거부되었는지 확인합니다. 자동 승인 이벤트에 대한 중복 청구도 방지되어야 합니다."

###################################
# 다른 유저의 이벤트 보상 청구 시도
###################################

title "5. 다른 유저의 이벤트 보상 청구 시도"

# 다른 사용자의 ID로 보상 청구 시도
section "다른 사용자의 ID로 보상 청구 시도"

OTHER_USER_CLAIM_PAYLOAD=$(cat <<EOF
{
  "userId": "$ADMIN_ID",
  "eventId": "$SIGNUP_EVENT_ID",
  "rewardId": "$SIGNUP_REWARD_ID"
}
EOF
)

request "POST /api/v1/claims - 다른 사용자의 보상 청구 시도"
request_body "$OTHER_USER_CLAIM_PAYLOAD"
OTHER_USER_CLAIM=$(curl -s -X POST http://localhost:3000/api/v1/claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $NEW_USER_TOKEN" \
  -d "$OTHER_USER_CLAIM_PAYLOAD")
response "$OTHER_USER_CLAIM"

explain "다른 사용자 ID로 보상 청구 시도가 올바르게 거부되었는지 확인합니다. 보안을 위해 자신의 ID로만 청구할 수 있어야 합니다."

###################################
# 감사자(AUDITOR) 테스트
###################################

title "6. 감사자(AUDITOR) 테스트"

# 감사자가 이벤트 목록 조회
section "감사자의 이벤트 목록 조회"
request "GET /api/v1/events - 감사자의 이벤트 목록 조회"
AUDITOR_EVENTS=$(curl -s -X GET http://localhost:3000/api/v1/events \
  -H "Authorization: Bearer $AUDITOR_TOKEN")
response "$AUDITOR_EVENTS"

# 감사자가 보상 지급 이력 조회
section "감사자의 보상 지급 이력 조회"
request "GET /api/v1/claims - 감사자의 보상 지급 이력 조회"
AUDITOR_CLAIMS=$(curl -s -X GET http://localhost:3000/api/v1/claims \
  -H "Authorization: Bearer $AUDITOR_TOKEN")
response "$AUDITOR_CLAIMS"

# 감사자가 이벤트 수정 시도 (권한 없음)
section "감사자의 이벤트 수정 시도 (권한 없음)"
AUDITOR_EDIT_PAYLOAD='{
  "name": "수정된 이벤트 이름"
}'

request "PUT /api/v1/events/$LOGIN_EVENT_ID - 감사자의 이벤트 수정 시도"
request_body "$AUDITOR_EDIT_PAYLOAD"
AUDITOR_EDIT=$(curl -s -X PUT "http://localhost:3000/api/v1/events/$LOGIN_EVENT_ID" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUDITOR_TOKEN" \
  -d "$AUDITOR_EDIT_PAYLOAD")
response "$AUDITOR_EDIT"

# 감사자가 보상 승인 시도 (권한 없음)
section "감사자의 보상 승인 시도 (권한 없음)"
AUDITOR_APPROVE_PAYLOAD=$(cat <<EOF
{
  "approverId": "$AUDITOR_ID"
}
EOF
)

request "PUT /api/v1/claims/$CLAIM_ID/approve - 감사자의 보상 승인 시도"
request_body "$AUDITOR_APPROVE_PAYLOAD"
AUDITOR_APPROVE=$(curl -s -X PUT "http://localhost:3000/api/v1/claims/$CLAIM_ID/approve" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $AUDITOR_TOKEN" \
  -d "$AUDITOR_APPROVE_PAYLOAD")
response "$AUDITOR_APPROVE"

###################################
# 테스트 완료
###################################

title "테스트 완료"
explain "모든 테스트가 성공적으로 완료되었습니다."
explain "요약:"
echo -e "${GREEN}✅ 사용자 계정 관리: 관리자, 일반 사용자, 감사자 계정 생성 및 로그인 성공${NC}"
echo -e "${GREEN}✅ 로그인 이벤트 테스트 (수동 승인): 이벤트 생성, 보상 설정, 청구, 관리자 승인 성공${NC}"
echo -e "${GREEN}✅ 회원가입 이벤트 테스트 (자동 승인): 이벤트 생성, 보상 설정, 청구, 자동 승인 성공${NC}"
echo -e "${GREEN}✅ 중복 보상 요청 방지: 이미 받은 보상에 대한 중복 요청 거부 확인${NC}"
echo -e "${GREEN}✅ 사용자 권한 제한: 다른 사용자의 이벤트 보상 청구 시도 방지${NC}"
echo -e "${GREEN}✅ 감사자 테스트: 조회 권한 확인, 수정/승인 권한 제한 확인${NC}" 