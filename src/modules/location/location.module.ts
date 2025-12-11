import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Location } from './location.entity';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
import { AdminService } from '../admin/admin.service';
import { Admin } from '../admin/admin.entity';
import { User } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';
import { File } from '../file/file.entity';
import { Repository } from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { Department } from '../departments/entities/department.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Location,
      Admin,
      User,
      File,
      Employee,
      Department,
    ]),
  ],
  controllers: [LocationController],
  providers: [
    LocationService,
    AdminService,
    UserService,
    FileService,
    Repository,
  ],
})
export class LocationModule { }
