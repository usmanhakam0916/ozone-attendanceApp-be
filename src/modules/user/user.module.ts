import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { User } from './user.entity';
import { File } from '../file/file.entity';
import { UserService } from './user.service';
import { FileService } from '../file/file.service';
import { Employee } from '../employee/employee.entity';
import { Department } from '../departments/entities/department.entity';
import { UserController } from './user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([User, File, Employee, Department])],
  controllers: [UserController],
  providers: [UserService, FileService],
  exports: [UserService, FileService],
})
export class UserModule { }
