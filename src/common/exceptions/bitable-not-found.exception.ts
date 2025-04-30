import { HttpException, HttpStatus } from '@nestjs/common';

export class BitableNotFoundException extends HttpException {
  constructor() {
    super('多维表记录未找到', HttpStatus.NOT_FOUND);
  }
} 