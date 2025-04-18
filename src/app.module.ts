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
import { UsersModule } from './users/users.module';
import { User } from './users/entities/user.entity';
import { UserBitable } from './users/entities/user-bitable.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [Resume, User, UserBitable],
        synchronize: true,
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    ResumeModule,
    CloudStorageModule,
    TencentCloudModule,
    FeishuModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
