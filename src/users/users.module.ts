import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './entities/user.entity';
import { UserBitable } from './entities/user-bitable.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtStrategy } from './jwt.strategy';
// import { EmailService } from './services/email.service';
import { ResumeModule } from '../resume/resume.module';
import { SmsService } from './services/sms.service';
import { RedisService } from './services/redis.service';
// import { SmsService } from './services/sms.service';
// import { RedisService } from './services/redis.service';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, UserBitable]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
      inject: [ConfigService],
    }),
    forwardRef(() => ResumeModule),
  ],
  controllers: [UsersController],
  providers: [UsersService, JwtStrategy, SmsService, RedisService],
  exports: [UsersService],
})
export class UsersModule {}
