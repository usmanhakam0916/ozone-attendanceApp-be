import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { AttendanceService } from '../attendance/attendance.service';
import { Employee } from '../employee/employee.entity';
import { User } from '../user/user.entity';
import { EmployeeService } from '../employee/employee.service';
import { UserService } from '../user/user.service';
import { DashboardController } from './dashboard.controller';
import { File } from '../file/file.entity';
import { FileService } from '../file/file.service';
import { LogService } from 'src/log/log.service';
import { Log } from 'src/log/log.entity';
import { LocationService } from '../location/location.service';
import { Location } from '../location/location.entity';
import { Admin } from '../admin/admin.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Attendance,
      Employee,
      User,
      File,
      Log,
      Location,
      Admin,
      Department,
    ]),
    HttpModule,
  ],
  controllers: [DashboardController],
  providers: [
    AttendanceService,
    UserService,
    EmployeeService,
    FileService,
    LogService,
    LocationService,
  ],
})
export class DashboardModule { }
