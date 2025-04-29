import { Module, forwardRef } from '@nestjs/common';
import { JobResumeController } from './resume.controller';
import { JobResumeService } from './resume.service';
import { FeishuModule } from '../../feishu/feishu.module';
import { JobUsersModule } from '../users/users.module';
import { TencentCloudModule } from '../../tencent-cloud/tencent-cloud.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    FeishuModule,
    TencentCloudModule,
    MulterModule.register({
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB
      },
    }),
    forwardRef(() => JobUsersModule),
  ],
  controllers: [JobResumeController],
  providers: [JobResumeService],
  exports: [JobResumeService],
})
export class JobResumeModule {} 