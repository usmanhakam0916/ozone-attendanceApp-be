import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GroupPolicy } from './group_policies.entity';
import { GroupPoliciesController } from './group_policies.controller';
import { AdminService } from '../admin/admin.service';
import { Admin } from '../admin/admin.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { File } from '../file/file.entity';
import { Repository } from 'typeorm';
import { EmployeeService } from '../employee/employee.service';
import { Employee } from '../employee/employee.entity';
import { GroupPolicyService } from './groupPolicy.service';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GroupPolicy,
      Admin,
      User,
      File,
      Employee,
      Department,
    ]),
  ],
  controllers: [GroupPoliciesController],
  providers: [
    AdminService,
    EmployeeService,
    GroupPolicyService,
    UserService,
    FileService,
    Repository,
  ],
})
export class GroupPolicyModule { }
