import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { User, UserType, UserStatus } from './user.entity';
import { Employee } from 'src/modules/employee/employee.entity';
import { Department } from 'src/modules/departments/entities/department.entity';
import { AppHelpers } from 'src/helpers/app.helpers';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) { }

  async findOne(username: string): Promise<User | undefined> {
    return await this.userRepo.findOne({ username });
  }

  async getById(id: number): Promise<User> {
    return this.userRepo.findOne({ id });
  }

  async save(data: User): Promise<User> {
    return this.userRepo.save(data);
  }

  async getByBatchNo(batchNo): Promise<User> {
    return this.userRepo.findOne({ username: batchNo.toString() });
  }

  async createHouseKeeping(data): Promise<User> {
    let num = data?.Id?.replace(/[-\s]/g, '');
    const findUser = await this.userRepo.findOne({
      where: { username: `${num}${data?.Company?.toUpperCase()[0]}` },
    });
    if (findUser) {
      throw new HttpException(
        `User already exist against this id:${data?.Id}`,
        HttpStatus.BAD_REQUEST,
      );
    } else {
      let employee = new Employee();
      let user = new User();
      user.username = `${num}${data?.Company?.toUpperCase()[0]}`;
      user.password = await AppHelpers.hashPassword('12345');
      user.type = UserType.EMPLOYEE;
      user.status = UserStatus.ACTIVE;
      user.isActiveDirectory = false;
      user.company = data?.Company?.toUpperCase();
      user.initialData = `{"Employee No":"${num}${data?.Company?.toUpperCase()[0]
        }","Name":"${data?.Name
        }","Position":"HOUSE KEEPING ${data?.Company?.toUpperCase()}","Department":"HOUSE KEEPING","Branch":"AGH (${data?.Branch
        })","emp_No":"${num}","emP_Name":"${data?.Name
        }","position_Name":"HOUSE KEEPING ${data?.Company?.toUpperCase()}","department_Name":"HOUSE KEEPING","location_Name":"AGH (${data?.Branch
        })","company_id":"${data.Id}"}`;
      user = await this.userRepo.save(user);
      let depertment: Department;
      if (data?.Branch === 'khobar') {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping - khobar' },
        });
      } else if (data?.Branch === 'dammam') {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping - dammam' },
        });
      } else if (data?.Branch === 'hofuf') {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping - hofuf' },
        });
      } else if (data?.Branch === 'jubail') {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping - jubail' },
        });
      } else if (data?.Branch === 'wafa') {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping - wafa' },
        });
      } else if (data?.Branch === 'amc') {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping - amc' },
        });
      } else {
        depertment = await this.departmentRepo.findOne({
          where: { name: 'housekeeping' },
        });
      }
      employee.authUser = user;
      employee.authUserId = user.id;
      employee.department = depertment;
      employee = await this.employeeRepo.save(employee);
      user.profileId = employee.id;
      user = await this.userRepo.save(user);
      return user;
    }
  }

  async create(data): Promise<User> {
    return this.userRepo.save(data).catch((e) => {
      // if (/(email)[\s\S]+(already exists)/.test(e.detail)) {
      //   throw new BadRequestException(
      //     'Account with this email already exists.',
      //   );
      // }
      if (/(username)[\s\S]+(already exists)/.test(e.detail)) {
        throw new BadRequestException(
          'Account with this username already exists.',
        );
      }
      return e;
    });
  }
}
