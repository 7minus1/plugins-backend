import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResumeController } from './resume.controller';
import { ResumeService } from './resume.service';
import { MulterModule } from '@nestjs/platform-express';
// 尝试使用相对路径引入模块，假设 feishu.module.ts 在 resume 目录的上一级的 feishu 目录下
import { FeishuModule } from '../feishu/feishu.module';
// import { CloudStorageModule } from '../cloud-storage/cloud-storage.module';
import { TencentCloudModule } from '../tencent-cloud/tencent-cloud.module';
import { CozeApiModule } from '../coze-api/coze-api.module';
import { FeishuService } from '../feishu/feishu.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    FeishuModule,
    // CloudStorageModule,
    TencentCloudModule,
    CozeApiModule,
  ],
  controllers: [ResumeController],
  providers: [ResumeService, FeishuService]
})
export class ResumeModule {}