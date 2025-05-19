export const JWT_CONSTANTS = {
  ACCESS_TOKEN_EXPIRY: '5m',
  REFRESH_TOKEN_EXPIRY: '7d',
  DEFAULT_ACCESS_SECRET: 'nexon-access-secret',
  DEFAULT_REFRESH_SECRET: 'nexon-refresh-secret',
} as const;

export const JWT_CONFIG_KEYS = {
  ACCESS_SECRET: 'JWT_ACCESS_SECRET',
  REFRESH_SECRET: 'JWT_REFRESH_SECRET',
} as const; 