import { Module } from '@nestjs/common';
import { FeishuService } from './feishu.service';
import { ConfigModule } from '@nestjs/config';
import { TencentCloudModule } from '../tencent-cloud/tencent-cloud.module';

@Module({
  imports: [ConfigModule, TencentCloudModule],
  providers: [FeishuService],
  exports: [FeishuService],
})
export class FeishuModule {}
