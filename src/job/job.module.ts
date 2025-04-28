import { Module } from '@nestjs/common';
import { JobUsersModule } from './users/users.module';
import { JobResumeModule } from './resume/resume.module';

@Module({
  imports: [JobUsersModule, JobResumeModule],
  providers: [],
  exports: [JobUsersModule, JobResumeModule],
})
export class JobModule {} 