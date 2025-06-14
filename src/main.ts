import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { LoggerService } from './common/logger/logger.service';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 获取日志服务
  const loggerService = app.get(LoggerService);
  
  // 设置全局日志服务
  app.useLogger(loggerService);

  // 设置全局基础路径
  app.setGlobalPrefix('api');

  // 配置全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 自动删除未定义的属性
      transform: true, // 自动转换类型
      forbidNonWhitelisted: true, // 禁止未定义的属性
    }),
  );

  // 使用全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());
  
  // 使用全局响应拦截器
  app.useGlobalInterceptors(
    new TransformInterceptor(),
    new LoggingInterceptor(loggerService), // 添加日志拦截器
  );

  // 配置 CORS
  app.enableCors({
    origin: [
      'https://lpt.liepin.com',
      'https://h.liepin.com',
      'https://exmail.qq.com',
      'https://www.zhipin.com',
      'http://www.taleap.net',
      'http://115.159.6.63:3000',
      'http://localhost:3000',
      /^chrome-extension:\/\/.*$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 打印日志信息
  loggerService.log('应用程序启动', 'Bootstrap');
  loggerService.log(`数据库连接: ${process.env.DB_HOST}`, 'Bootstrap');
  loggerService.log(`监听端口: ${process.env.PORT ?? 3000}`, 'Bootstrap');

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
