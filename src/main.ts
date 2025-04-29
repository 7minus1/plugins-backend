import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
// import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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
  app.useGlobalInterceptors(new TransformInterceptor());

  // 配置 CORS
  app.enableCors({
    origin: [
      'https://lpt.liepin.com',
      'https://h.liepin.com',
      'https://exmail.qq.com',
      'https://www.zhipin.com',
      /^chrome-extension:\/\/.*$/,
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });

  // 配置 Swagger
  // const config = new DocumentBuilder()
  //   .setTitle('API')
  //   .setDescription('API 文档')
  //   .setVersion('1.0')
  //   .addBearerAuth()
  //   .build();
  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('api', app, document);

  // 打印数据库连接信息 DB_HOST
  console.log('DB_HOST:', process.env.DB_HOST);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
