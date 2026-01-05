import * as dotenv from 'dotenv';
import { HttpModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';

import { UserModule } from '../user/user.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './jwt.strategy';
import { LocalStrategy } from './local.strategy';
import { AuthController } from './auth.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { EmployeeService } from '../employee/employee.service';
import { Employee } from '../employee/employee.entity';
import { Admin } from '../admin/admin.entity';
import { AdminService } from '../admin/admin.service';
import { VersionManagerService } from '../versionManager/version_manager.service';
import { VersionManager } from '../versionManager/version_manager.entity';
import { Department } from '../departments/entities/department.entity';
import { Attendance } from '../attendance/attendance.entity';
import { Location } from '../location/location.entity';
import EmailService from '../email/email.service';

// todo: this shouldn't be here
dotenv.config();

@Module({
  imports: [
    HttpModule,
    UserModule,
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // todo: fix the expiry period
      signOptions: { expiresIn: '365d' },
    }),
    TypeOrmModule.forFeature([
      User,
      Employee,
      Admin,
      VersionManager,
      Department, Attendance, Location
    ]),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    JwtStrategy,
    UserService,
    EmployeeService,
    EmailService,
    AdminService,
    VersionManagerService,
  ],
  exports: [AuthService],
})
export class AuthModule { }
