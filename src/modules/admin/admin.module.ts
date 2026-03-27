import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Department } from '../departments/entities/department.entity';
import { Employee } from '../employee/employee.entity';
import { File } from '../file/file.entity';
import { FileService } from '../file/file.service';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { AdminController } from './admin.controller';

import { Admin } from './admin.entity';
import { AdminService } from './admin.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Admin, User, File, Employee, Department]),
  ],
  controllers: [AdminController],
  providers: [UserService, FileService, AdminService],
})
export class AdminModule { }
