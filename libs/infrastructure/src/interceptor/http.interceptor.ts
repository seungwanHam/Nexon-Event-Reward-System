// libs/infrastructure/src/interceptor/http.interceptor.ts
import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class HttpInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    if (context.getType() !== 'http') {
      return next.handle(); // HTTP 요청이 아니면 처리하지 않음
    }

    const req = context.switchToHttp().getRequest();
    const { method, originalUrl, body } = req;
    const userAgent = req.get('user-agent') || '';
    const { ip } = req;

    this.logger.log(`${method} ${originalUrl} - ${ip} - ${userAgent}`);

    const now = Date.now();
    return next.handle().pipe(
      tap((res) => {
        const response = context.switchToHttp().getResponse();
        const delay = Date.now() - now;
        this.logger.log(`${method} ${originalUrl} - ${response.statusCode} - ${delay}ms`);
      }),
    );
  }
}