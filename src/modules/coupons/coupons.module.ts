import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Coupons } from './coupons.entity';
import { CouponsController } from './coupons.controller';
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
      Coupons,
      Admin,
      User,
      File,
      Employee,
      Department,
    ]),
  ],
  controllers: [CouponsController],
  providers: [AdminService, UserService, FileService, Repository],
})
export class CouponsModule { }
