import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(phone: string, verificationCode: string): Promise<any> {
    try {
      return await this.usersService.login(phone, verificationCode);
    } catch (error) {
      return null;
    }
  }
} 