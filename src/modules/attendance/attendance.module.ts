import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Attendance } from './attendance.entity';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { File } from '../file/file.entity';
import { AdminService } from '../admin/admin.service';
import { EmployeeService } from '../employee/employee.service';
import { Admin } from '../admin/admin.entity';
import { Employee } from '../employee/employee.entity';
import { LocationService } from '../location/location.service';
import { Location } from '../location/location.entity';
import { Log } from 'src/log/log.entity';
import { LogService } from 'src/log/log.service';
import { VersionManagerService } from '../versionManager/version_manager.service';
import { VersionManager } from '../versionManager/version_manager.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Attendance,
      File,
      Admin,
      Employee,
      Location,
      VersionManager,
      Log,
      Department,
    ]),
    HttpModule,
  ],
  controllers: [AttendanceController],
  providers: [
    AttendanceService,
    UserService,
    FileService,
    AdminService,
    EmployeeService,
    Repository,
    LocationService,
    LogService,
    VersionManagerService,
  ],
})
export class AttendanceModule { }
