import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TencentCloudService } from './tencent-cloud.service';

@Module({
  imports: [ConfigModule],
  providers: [TencentCloudService],
  exports: [TencentCloudService]
})
export class TencentCloudModule {}