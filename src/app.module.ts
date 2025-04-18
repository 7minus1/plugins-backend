import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ResumeModule } from './resume/resume.module';
import { Resume } from './resume/entities/resume.entity';
import { CloudStorageModule } from './cloud-storage/cloud-storage.module';
import { TencentCloudModule } from './tencent-cloud/tencent-cloud.module';
import { FeishuModule } from './feishu/feishu.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_DATABASE'),
        entities: [Resume],
        synchronize: true,
      }),
      inject: [ConfigService],
    }),
    ResumeModule,
    CloudStorageModule,
    TencentCloudModule,
    FeishuModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
