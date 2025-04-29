import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { HrUsersService } from './users.service';
import { HrUsersController } from './users.controller';
import { HrUser } from './entities/user.entity';
import { HrUserBitable } from './entities/user-bitable.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HrJwtStrategy } from './jwt.strategy';
import { HrResumeModule } from '../resume/resume.module';
import { HrSmsService } from './services/sms.service';
import { HrRedisService } from './services/redis.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([HrUser, HrUserBitable]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => HrResumeModule),
  ],
  controllers: [HrUsersController],
  providers: [HrUsersService, HrJwtStrategy, HrSmsService, HrRedisService],
  exports: [HrUsersService],
})
export class HrUsersModule {} 