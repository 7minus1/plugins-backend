import { HttpException, HttpStatus } from '@nestjs/common';

export class BitableConfigException extends HttpException {
  constructor() {
    super('多维表配置验证失败，请检查URL和Token是否正确', HttpStatus.BAD_REQUEST);
  }
} 