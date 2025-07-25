import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CozeApiService } from './coze-api.service';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [CozeApiService],
  exports: [CozeApiService],
})
export class CozeApiModule {}
