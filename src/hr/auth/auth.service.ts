import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { HrUsersService } from '../users/users.service';

@Injectable()
export class HrAuthService {
  constructor(
    private usersService: HrUsersService,
    private jwtService: JwtService,
  ) {}

  async login(user: any) {
    const payload = { phoneNumber: user.phoneNumber, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
} 