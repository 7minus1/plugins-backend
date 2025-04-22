import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as tencentcloud from 'tencentcloud-sdk-nodejs';

@Injectable()
export class SmsService {
  private client: any;

  constructor(private configService: ConfigService) {
    const SmsClient = tencentcloud.sms.v20210111.Client;
    this.client = new SmsClient({
      credential: {
        secretId: this.configService.get('TENCENT_SECRET_ID'),
        secretKey: this.configService.get('TENCENT_SECRET_KEY'),
      },
      region: 'ap-guangzhou',
      profile: {
        signMethod: 'HmacSHA256',
        httpProfile: {
          reqMethod: 'POST',
          reqTimeout: 30,
          endpoint: 'sms.tencentcloudapi.com',
        },
      },
    });
  }

  async sendVerificationCode(phoneNumber: string, code: string): Promise<boolean> {
    try {
      const params = {
        SmsSdkAppId: this.configService.get('TENCENT_SMS_SDK_APP_ID'),
        SignName: this.configService.get('TENCENT_SMS_SIGN_NAME'),
        TemplateId: this.configService.get('TENCENT_SMS_TEMPLATE_ID'),
        PhoneNumberSet: [`+86${phoneNumber}`],
        TemplateParamSet: [code, 5],
      };
      console.log(params);
      console.log(this.client);

      const result = await this.client.SendSms(params);
      return result.SendStatusSet[0].Code === 'Ok';
    } catch (error) {
      console.error('发送短信失败:', error);
      return false;
    }
  }
} 