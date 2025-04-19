import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient } from 'redis';

@Injectable()
export class RedisService {
  private client: any;

  constructor(private configService: ConfigService) {
    this.client = createClient({
      url: this.configService.get('REDIS_URL'),
    });
    this.client.connect();
  }

  async setVerificationCode(phone: string, code: string): Promise<void> {
    const key = `verification:${phone}`;
    await this.client.set(key, code, {
      EX: 300, // 5分钟过期
    });
  }

  async getVerificationCode(phone: string): Promise<string | null> {
    const key = `verification:${phone}`;
    return await this.client.get(key);
  }

  async deleteVerificationCode(phone: string): Promise<void> {
    const key = `verification:${phone}`;
    await this.client.del(key);
  }
} 