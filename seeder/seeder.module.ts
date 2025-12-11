import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import * as dotenv from 'dotenv';
import { SeederService } from './seeder.service';
import { Employee } from 'src/modules/employee/employee.entity';
import { User } from 'src/modules/user/user.entity';
import { GroupPolicy } from 'src/modules/groupPolicy/group_policies.entity';
import { DeviceIdTracking } from 'src/modules/devicdIdTracking/entities/deviceIdTracking.entity';
import { Attendance } from 'src/modules/attendance/attendance.entity';
import { Location } from 'src/modules/location/location.entity';
import { Admin } from 'src/modules/admin/admin.entity';
import { File } from 'src/modules/file/file.entity';
import { Department } from 'src/modules/departments/entities/department.entity';

dotenv.config();

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      // todo: fix the expiry period
      signOptions: { expiresIn: '600000s' },
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      database: process.env.DATABASE_NAME,
      username: process.env.DATABASE_USER,
      password: process.env.DATABASE_PASSWORD,
      host: process.env.DATABASE_HOST,
      port: parseInt(process.env.DATABASE_PORT),
      autoLoadEntities: true,
      synchronize: true,
    }),
    TypeOrmModule.forFeature([
      Employee,
      User,
      GroupPolicy,
      DeviceIdTracking,
      Attendance,
      Location,
      Admin,
      File,
      Department,
    ]),
  ],

  providers: [SeederService],
})
export class SeederModule {}
