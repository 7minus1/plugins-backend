import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  // 设置全局基础路径
  app.setGlobalPrefix('api');
  
  // 启用全局验证管道
  app.useGlobalPipes(new ValidationPipe());
  
  // 配置 CORS
  app.enableCors({
    origin: 'chrome-extension://dfjedaainbcnhdbbicbemhfghhibkaca',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    credentials: true,
  });
  
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
