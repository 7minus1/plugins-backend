import { Module } from '@nestjs/common';
import { HrUsersModule } from './users/users.module';
import { HrResumeModule } from './resume/resume.module';

@Module({
  imports: [HrUsersModule, HrResumeModule],
  exports: [HrUsersModule, HrResumeModule],
})
export class HrModule {} 