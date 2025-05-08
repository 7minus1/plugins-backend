import { Module } from '@nestjs/common';
import { JobRedisService } from './redis.service';

@Module({
  providers: [JobRedisService],
  exports: [JobRedisService],
})
export class JobRedisModule {} 