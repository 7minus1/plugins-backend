import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { JobUsersService } from './users.service';
import { JobUsersController } from './users.controller';
import { JobUser } from './entities/user.entity';
import { JobUserBitable } from './entities/user-bitable.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobJwtStrategy } from './jwt.strategy';
import { JobSmsService } from './services/sms.service';
import { JobRedisService } from './services/redis.service';
import { JobResumeModule } from '../resume/resume.module';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      JobUser,
      JobUserBitable
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    JobResumeModule,
  ],
  controllers: [JobUsersController],
  providers: [
    JobUsersService, 
    JobJwtStrategy, 
    JobSmsService, 
    JobRedisService,
  ],
  exports: [JobUsersService],
})
export class JobUsersModule {} 