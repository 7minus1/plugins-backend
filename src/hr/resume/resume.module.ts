import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HrResumeController } from './resume.controller';
import { HrResumeService } from './resume.service';
import { MulterModule } from '@nestjs/platform-express';
import { FeishuModule } from '../../feishu/feishu.module';
import { TencentCloudModule } from '../../tencent-cloud/tencent-cloud.module';
import { CozeApiModule } from '../../coze-api/coze-api.module';
import { FeishuService } from '../../feishu/feishu.service';
import { HrUsersModule } from '../users/users.module';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    FeishuModule,
    TencentCloudModule,
    CozeApiModule,
    forwardRef(() => HrUsersModule),
  ],
  controllers: [HrResumeController],
  providers: [HrResumeService, FeishuService],
  exports: [HrResumeService],
})
export class HrResumeModule {} 