import { Observable } from 'rxjs';
import { RequestData, ResponseData } from './common.interface';

// 인증 서비스 응답
export interface AuthResponse {
  id: string;
  nickname: string;
  email: string;
  roles: string[];
  accessToken: string;
  refreshToken: string;
}

// 토큰 응답
export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
}

// 로그아웃 응답
export interface LogoutResponse {
  success: boolean;
}

// 프로필 응답
export interface ProfileResponse {
  id: string;
  nickname: string;
  email: string;
  roles: string[];
  status: string;
  lastLoginAt: string;
  metadata: { [key: string]: string };
  createdAt: string;
  updatedAt: string;
}

// 회원가입 요청
export interface RegisterRequest {
  nickname: string;
  email: string;
  password: string;
  roles: string[];
}

// 로그인 요청
export interface LoginRequest {
  email: string;
  password: string;
}

// 토큰 갱신 요청
export interface RefreshTokenRequest {
  userId: string;
  refreshToken: string;
}

// 로그아웃 요청
export interface LogoutRequest {
  userId: string;
}

// 프로필 요청
export interface ProfileRequest {
  userId: string;
}

// 사용자 정보 업데이트 요청
export interface UpdateUserRequest {
  userId: string;
  nickname: string;
  email: string;
  password: string;
  roles: string[];
  status: string;
  metadata: { [key: string]: string };
}

// Auth 서비스 인터페이스
export interface AuthService {
  register(request: RegisterRequest): Observable<AuthResponse>;
  login(request: LoginRequest): Observable<AuthResponse>;
  refreshToken(request: RefreshTokenRequest): Observable<TokenResponse>;
  logout(request: LogoutRequest): Observable<LogoutResponse>;
  getProfile(request: ProfileRequest): Observable<ProfileResponse>;
  updateUser(request: UpdateUserRequest): Observable<AuthResponse>;
} 