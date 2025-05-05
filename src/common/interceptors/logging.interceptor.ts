import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from '../logger/logger.service';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers, ip } = request;
    const userAgent = headers['user-agent'] || '';
    const now = Date.now();

    // 记录请求信息
    this.loggerService.log(
      `${method} ${url} - Body: ${JSON.stringify(body)} - UserAgent: ${userAgent} - IP: ${ip}`,
      'HTTP Request'
    );

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const responseTime = Date.now() - now;

          // 记录响应信息
          this.loggerService.log(
            `${method} ${url} - ${statusCode} - ${responseTime}ms`,
            'HTTP Response'
          );

          // 如果需要记录返回的数据，可以取消下面注释
          // this.loggerService.debug(
          //   `Response data: ${JSON.stringify(data)}`,
          //   'HTTP Response'
          // );
        },
        error: (error) => {
          const responseTime = Date.now() - now;
          
          // 记录错误信息
          this.loggerService.error(
            `${method} ${url} - ${error.status || 500} - ${responseTime}ms - ${error.message}`,
            error.stack,
            'HTTP Response Error'
          );
        }
      })
    );
  }
} 