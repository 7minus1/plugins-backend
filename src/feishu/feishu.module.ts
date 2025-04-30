import { Module, forwardRef } from '@nestjs/common';
import { FeishuService } from './feishu.service';
import { ConfigModule } from '@nestjs/config';
import { HrModule } from '../hr/hr.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => HrModule),
  ],
  providers: [FeishuService],
  exports: [FeishuService],
})
export class FeishuModule {}
