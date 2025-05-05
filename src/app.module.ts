import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { UsersModule } from './users/users.module';
// import { ResumeModule } from './resume/resume.module';
// import { AuthModule } from './auth/auth.module';
import { HrModule } from './hr/hr.module';
import { JobModule } from './job/job.module';
import { LoggerModule } from './common/logger/logger.module';
// import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT, 10) || 3306,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: process.env.NODE_ENV !== 'production',
      extra: {
        charset: 'utf8mb4_unicode_ci',
      },
    }),
    // UsersModule,
    // ResumeModule,
    HrModule,
    JobModule,
    LoggerModule,
    // AuthModule,
    // PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
