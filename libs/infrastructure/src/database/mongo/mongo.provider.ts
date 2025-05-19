import { Provider } from '@nestjs/common';
import { MongooseModule, MongooseModuleOptions } from '@nestjs/mongoose';
import { DatabaseConfigOptions } from '../interface/database-config.interface';

/**
 * MongoDB 연결 프로바이더 생성
 * @param options 데이터베이스 연결 설정
 * @returns MongoDB 프로바이더
 */
export function createMongoProvider(options: DatabaseConfigOptions): any {
  // 기본 URI 생성
  let uri = options.uri || process.env.MONGODB_URI || 'mongodb://localhost:27017/nexon-event-system';
  
  // 데이터베이스 이름이 URI에 포함되어 있지 않은 경우 추가
  if (options.dbName && !uri.includes('mongodb+srv://') && !uri.includes('/')) {
    if (!uri.endsWith('/')) {
      uri += '/';
    }
    uri += options.dbName;
  }

  // 인증 정보가 있는 경우 추가
  if (options.username && options.password && !uri.includes('@')) {
    const [protocol, rest] = uri.split('://');
    uri = `${protocol}://${options.username}:${options.password}@${rest}`;
  }

  // 기본 MongoDB 옵션 설정
  const mongooseOptions: MongooseModuleOptions = {
    connectionFactory: (connection) => {
      // 논리적 디버그 모드 설정
      if (options.debug || process.env.NODE_ENV === 'development') {
        connection.set('debug', true);
      }
      connection.set('autoIndex', options.autoIndex !== undefined ? options.autoIndex : true);
      return connection;
    },
  };

  return MongooseModule.forRoot(uri, mongooseOptions);
}

/**
 * MongoDB 스키마 프로바이더 생성
 * @param schemas MongoDB 스키마 배열
 * @returns MongoDB 스키마 프로바이더
 */
export function createMongoSchemaProviders(schemas: { name: string; schema: any }[]): any {
  return MongooseModule.forFeature(schemas);
} 