import { IsString, IsMobilePhone } from 'class-validator';

export class SendHrVerificationCodeDto {
  @IsMobilePhone('zh-CN')
  phoneNumber: string;
}

export class VerifyHrCodeDto {
  @IsMobilePhone('zh-CN')
  phoneNumber: string;

  @IsString()
  code: string;
} 