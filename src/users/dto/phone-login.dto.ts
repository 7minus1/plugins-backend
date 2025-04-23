import { IsString, IsMobilePhone } from 'class-validator';

export class SendVerificationCodeDto {
  @IsMobilePhone('zh-CN')
  phoneNumber: string;
}

export class VerifyCodeDto {
  @IsMobilePhone('zh-CN')
  phoneNumber: string;

  @IsString()
  code: string;
}
