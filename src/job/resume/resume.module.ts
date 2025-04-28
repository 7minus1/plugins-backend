import { Module, forwardRef } from '@nestjs/common';
import { JobResumeController } from './resume.controller';
import { JobResumeService } from './resume.service';
import { FeishuModule } from '../../feishu/feishu.module';
import { JobUsersModule } from '../users/users.module';

@Module({
  imports: [
    FeishuModule,
    forwardRef(() => JobUsersModule),
  ],
  controllers: [JobResumeController],
  providers: [JobResumeService],
  exports: [JobResumeService],
})
export class JobResumeModule {} 