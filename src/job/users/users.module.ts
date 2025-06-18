import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JobUsersService } from './users.service';
import { JobUsersController } from './users.controller';
import { JobVipTypeController } from './vip-type.controller';
import { JobUser } from './entities/user.entity';
import { JobUserBitable } from './entities/user-bitable.entity';
import { JobVipType } from './entities/vip-type.entity';
import { JobSmsModule } from './services/sms.module';
import { JobRedisModule } from './services/redis.module';
import { JobResumeModule } from '../resume/resume.module';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobJwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      JobUser,
      JobUserBitable,
      JobVipType
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    JobSmsModule,
    JobRedisModule,
    forwardRef(() => JobResumeModule),
  ],
  controllers: [JobUsersController, JobVipTypeController],
  providers: [JobUsersService, JobJwtStrategy],
  exports: [JobUsersService],
})
export class JobUsersModule {} 