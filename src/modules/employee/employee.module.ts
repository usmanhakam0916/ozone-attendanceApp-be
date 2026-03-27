import { Module, HttpModule } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Employee } from './employee.entity';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { File } from '../file/file.entity';
import EmailService from '../email/email.service';
import { LocationService } from '../location/location.service';
import { Location } from '../location/location.entity';
import { Admin } from '../admin/admin.entity';
import { GroupPolicy } from '../groupPolicy/group_policies.entity';
import { GroupPolicyService } from '../groupPolicy/groupPolicy.service';
import { Department } from '../departments/entities/department.entity';
import { DeviceIdTracking } from "../devicdIdTracking/entities/deviceIdTracking.entity";
import { DeviceIdTrackingService } from "../devicdIdTracking/deviceIdTracking.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      Employee,
      File,
      Location,
      Admin,
      GroupPolicy,
      Department,
      DeviceIdTracking
    ]),
    HttpModule,
  ],
  controllers: [EmployeeController],
  providers: [
    EmployeeService,
    UserService,
    FileService,
    EmailService,
    LocationService,
    GroupPolicyService,
    Repository,
    DeviceIdTrackingService
  ],
})
export class EmployeeModule { }
