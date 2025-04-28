import { IsString, IsMobilePhone } from 'class-validator';

export class SendJobVerificationCodeDto {
  @IsMobilePhone('zh-CN')
  phoneNumber: string;
}

export class VerifyJobCodeDto {
  @IsMobilePhone('zh-CN')
  phoneNumber: string;

  @IsString()
  code: string;
} 