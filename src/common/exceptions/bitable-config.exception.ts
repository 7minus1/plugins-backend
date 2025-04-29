import { HttpException, HttpStatus } from '@nestjs/common';

export class BitableConfigException extends HttpException {
  constructor(message?: string) {
    super(message || '多维表配置失败', HttpStatus.BAD_REQUEST);
  }
} 