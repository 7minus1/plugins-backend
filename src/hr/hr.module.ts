import { Module } from '@nestjs/common';
import { HrUsersModule } from './users/users.module';
import { HrResumeModule } from './resume/resume.module';
import { HrAuthModule } from './auth/auth.module';

@Module({
  imports: [HrUsersModule, HrResumeModule, HrAuthModule],
  exports: [HrUsersModule, HrResumeModule, HrAuthModule],
})
export class HrModule {} 