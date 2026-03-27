import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { File } from './file.entity';
import { User } from '../user/user.entity';
import { FileService } from './file.service';
import { UserService } from '../user/user.service';
import { FileController } from './file.controller';
import { Employee } from '../employee/employee.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [TypeOrmModule.forFeature([File, User, Employee, Department])],
  controllers: [FileController],
  providers: [FileService, UserService],
  exports: [FileService, UserService],
})
export class FileModule { }
