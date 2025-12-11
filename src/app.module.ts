import {
  Module,
  ValidationPipe,
  NestModule,
  MiddlewareConsumer,
  Logger,
} from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import * as Joi from 'joi';

import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UserModule } from './modules/user/user.module';
import { FileModule } from './modules/file/file.module';
import { AppController } from './app.controller';
import { AdminModule } from './modules/admin/admin.module';
import { JwtAuthGuard } from './modules/auth/jwt-auth.guard';
import { EmployeeModule } from './modules/employee/employee.module';
import { LocationModule } from './modules/location/location.module';
import { AttendanceModule } from './modules/attendance/attendance.module';
import { GroupPolicyModule } from './modules/groupPolicy/groupPolicy.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { CouponsModule } from './modules/coupons/coupons.module';
import { ScheduleModule } from '@nestjs/schedule';
import { LoggerMiddleware } from './middelwares/logger.middeleware';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { VersionManagerModule } from './modules/versionManager/version_manager.module';

// bugsnag implementation
import { BugsnagModule } from '@nkaurelien/nest-bugsnag';
import BugsnagPluginExpress from '@bugsnag/plugin-express';
import { MulterModule } from '@nestjs/platform-express';
import { DepartmentsModule } from './modules/departments/departments.module';
import { DeviceIdTrackingModule } from './modules/devicdIdTracking/deviceIdTracking.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MulterModule.register({
      dest: '../public/uploads',
    }),
    BugsnagModule.forRoot({
      apiKey: process.env.BUGSNAG_API_KEY,
      plugins: [BugsnagPluginExpress],
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'public'),
    }),
    ConfigModule.forRoot({
      // todo: pull this  validationSchema into a separate module
      validationSchema: Joi.object({
        // misc
        PORT: Joi.number(),

        // db
        DATABASE_HOST: Joi.string().required(),
        DATABASE_PORT: Joi.number().required(),
        DATABASE_USER: Joi.string().required(),
        DATABASE_PASSWORD: Joi.string().required(),
        DATABASE_NAME: Joi.string().required(),

        // jwt
        JWT_SECRET: Joi.string().required(),
        JWT_EXPIRATION_TIME: Joi.string().required(),

        // aws
        AWS_REGION: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_PUBLIC_BUCKET_NAME: Joi.string().required(),
      }),
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      autoLoadEntities: true,
      synchronize: true,
    }),
    DashboardModule,
    CouponsModule,
    AuthModule,
    UserModule,
    FileModule,
    AdminModule,
    EmployeeModule,
    LocationModule,
    AttendanceModule,
    GroupPolicyModule,
    VersionManagerModule,
    DepartmentsModule,
    DeviceIdTrackingModule
  ],
  controllers: [AppController],
  providers: [
    AppService,
    Logger,
    ValidationPipe,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule
  implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
