import { Module } from '@nestjs/common';
import { HrAuthService } from './auth.service';
import { HrAuthController } from './auth.controller';
import { HrUsersModule } from '../users/users.module';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { HrJwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    HrUsersModule,
    PassportModule,
    JwtModule.register({
      secret: 'your-secret-key',
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [HrAuthService, HrJwtStrategy],
  controllers: [HrAuthController],
  exports: [HrAuthService],
})
export class HrAuthModule {} 