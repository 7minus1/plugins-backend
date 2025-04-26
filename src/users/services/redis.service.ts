import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService {
  private client: Redis;

  constructor(private configService: ConfigService) {
    this.client = new Redis({
      host: this.configService.get('REDIS_HOST'),
      port: this.configService.get('REDIS_PORT'),
      password: this.configService.get('REDIS_PASSWORD'),
    });
  }

  async setVerificationCode(
    phoneNumber: string,
    code: string,
    expireSeconds: number = 300,
  ): Promise<void> {
    const key = `verification_code:${phoneNumber}`;
    await this.client.set(key, code, 'EX', expireSeconds);
  }

  async getVerificationCode(phoneNumber: string): Promise<string | null> {
    const key = `verification_code:${phoneNumber}`;
    return await this.client.get(key);
  }

  async deleteVerificationCode(phoneNumber: string): Promise<void> {
    const key = `verification_code:${phoneNumber}`;
    await this.client.del(key);
  }
}
