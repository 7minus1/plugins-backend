import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    
    // 如果是HttpException，使用它的状态码和消息
    // 否则使用通用的500错误
    const status = 
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    
    // 处理错误消息
    let message = 'Internal server error';
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      message = typeof exceptionResponse === 'object' && exceptionResponse 
        ? (typeof exceptionResponse['message'] === 'string' 
            ? exceptionResponse['message'] 
            : Array.isArray(exceptionResponse['message']) 
              ? exceptionResponse['message'].join(', ')
              : exception.message)
        : exception.message;
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    
    // 返回标准化的错误响应
    response.status(status).json({
      success: false,
      timestamp: new Date().toISOString(),
      path: request.url,
      message,
      code: status,
    });
  }
} 