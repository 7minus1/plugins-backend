import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import COS from 'cos-nodejs-sdk-v5';

@Injectable()
export class TencentCloudService {
  private cos: COS;

  constructor(private config: ConfigService) {
    console.log('CSS配置参数:', {
      region: config.get('TENCENT_COS_REGION'),
      bucket: config.get('TENCENT_COS_BUCKET'),
      SecretId: config.get('TENCENT_COS_SECRET_ID'),
      accessKey: config.get('TENCENT_COS_SECRET_KEY')?.slice(0, 6) + '...',
    });
    this.cos = new COS({
      SecretId: config.get('TENCENT_COS_SECRET_ID'),
      SecretKey: config.get('TENCENT_COS_SECRET_KEY'),
    });
    console.log('COS实例创建成功');
  }

  async uploadFile(filename: string, buffer: Buffer) {
    try {
      const result = await this.cos.putObject({
        Bucket: this.config.get('TENCENT_COS_BUCKET'),
        Region: this.config.get('TENCENT_COS_REGION'),
        Key: filename,
        Body: buffer,
        ACL: 'public-read',
      });

      return {
        url: `https://${result.Location}`,
        name: filename,
      };
    } catch (error) {
      throw new Error(`COS文件上传失败: ${error.message}`);
    }
  }
}
