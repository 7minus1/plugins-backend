import { Module } from '@nestjs/common';
import { JobSmsService } from './sms.service';

@Module({
  providers: [JobSmsService],
  exports: [JobSmsService],
})
export class JobSmsModule {} 