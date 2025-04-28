import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { HrUsersService } from '../../users/users.service';

@Injectable()
export class HrJwtStrategy extends PassportStrategy(Strategy) {
  constructor(private usersService: HrUsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
    });
  }

  async validate(payload: any) {
    const user = await this.usersService.findByPhone(payload.phoneNumber);
    return user;
  }
} 