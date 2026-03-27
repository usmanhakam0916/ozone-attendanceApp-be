import { Repository, Like, IsNull, Not } from 'typeorm';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Employee } from './employee.entity';
import * as path from 'path';
import { UserService } from '../user/user.service';
import {
  User,
  UserStatus,
  UserType,
  userStatusHash,
} from '../user/user.entity';
import { FileService } from '../file/file.service';
import * as fs from 'fs';
import { AppHelpers } from 'src/helpers/app.helpers';
import { Department } from '../departments/entities/department.entity';

@Injectable()
export class EmployeeService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) { }

  async findById(id: number): Promise<Employee> {
    return this.employeeRepo.findOne(id);
  }

  async findByDeviceId(deviceId: string) {
    return this.employeeRepo.createQueryBuilder('e')
      .leftJoinAndSelect('e.authUser', 'au')
      .where('au.deviceId=:deviceId', { deviceId }).getOne();
  }

  async save(data: Employee): Promise<Employee> {
    return this.employeeRepo.save(data);
  }

  async findMultipleById(data: number[]): Promise<Employee[]> {
    return await this.employeeRepo
      .createQueryBuilder('employee')
      .where('id in (:...ids)', { ids: data })
      .getMany();
  }

  create = async (data): Promise<Employee> => {
    data.authUser.type = UserType.EMPLOYEE;
    data.authUser.status = UserStatus.INACTIVE;
    const authUser = await this.userService.create(data.authUser);
    const newEmployee = new Employee();
    newEmployee.authUser = authUser;
    newEmployee.department = data.department;
    const employee = await this.employeeRepo.save(newEmployee);
    authUser.profileId = employee.id;
    await this.userRepo.save(authUser);
    return employee;
  };

  getEmployeeByBatchNo = async (batchNo) => {
    const authUser = await this.userRepo.findOne({
      username: batchNo.toString(),
    });

    return this.employeeRepo.findOne({ authUser });
  };

  findByAuthUserId = async (id) => {
    const authUser = await this.userRepo.findOne({
      id,
    });
    const result = await this.employeeRepo.findOne({
      where: { authUserId: authUser.id },
      relations: ['locations'],
    }); return result;
  };

  searchEmployees = async (query) => {
    const users = await this.userRepo.find({
      username: Like(`${query.query}%`),
    });
    let employees = [];
    if (users.length > 0) {
      const user_ids = users.map((user) => user.id);
      const found = await this.employeeRepo
        .createQueryBuilder('employee')
        .leftJoinAndSelect('employee.authUser', 'user')
        .where('"authUserId" in (:...ids)', { ids: [...user_ids] })
        .getMany();
      employees = [...found];
    }
    return employees;
  };

  createInitialDataObject = (empData: Object) => {
    var initialData = {};
    if (Object.keys(empData).length > 0) {
      initialData = {
        'Employee No': empData['emp_No'],
        Name: empData['emP_Name'],
        Position: empData['position_Name'],
        Department: empData['department_Name'],
        Branch: empData['location_Name'],
        Role: empData['role'] || '',
        'Mac Address': empData['Mac_Address'] || 'NA',
        'Location Type': empData['location_Type'] || '',
        'Assigned Location': empData['assigned_Location'] || '',
        HOD: empData['HOD'] || '',
        'Early Check-In Allowed': empData['early_Check_In_Allowed'] || '',
        Status: userStatusHash[empData['emp_Status']],
        lastWorkingDate: empData['lastWorkingDate'],
      };
    }
    return initialData;
  };

  async uploadProfilePicture() {
    const employees = await this.employeeRepo.find({
      where: {
        avatarId: Not(IsNull()),
      },
    });
    for (const employee of employees) {
      const file = path.join(__dirname, '../../../', employee.avatar.url);
      const res = await this.fileService.uploadFileToS3(
        {
          buffer: fs.readFileSync(file),
          originalname: employee.avatar.name,
        },
        'userProfiles',
      );
      await this.fileService.updateKey(res.Key, employee.avatar.id);
    }
  }

  async addEmployeeDepartments() {
    try {
      const totalEmployees = await this.employeeRepo.count();
      const loopIteration = Math.ceil(totalEmployees / 10);
      const countArray = Array.from({ length: loopIteration }, (v, i) => i);
      let indexCount1 = 1;
      for (const index of countArray) {
        const skip = index == 0 ? 0 : index * 10 + 1;
        const employees = await this.employeeRepo.find({
          take: 10,
          skip,
        });
        let indexCount = 1;
        for (const employee of employees) {
          console.log(indexCount, indexCount1);
          indexCount += 1;
          indexCount1 += 1;
          const user = employee.authUser;
          if (user?.initialData) {
            const initialData = JSON.parse(user.initialData);
            const departmentName = AppHelpers.removeExtraSpaces(
              initialData?.department_Name,
            );
            if (departmentName) {
              let existingDepartment = await this.departmentRepo.findOne({
                where: { name: departmentName },
              });
              if (!existingDepartment) {
                existingDepartment = new Department();
                existingDepartment.name = departmentName;
                existingDepartment = await this.departmentRepo.save(
                  existingDepartment,
                );
              }
              employee.department = existingDepartment;
              await this.employeeRepo.save(employee);
            }
          }
        }
      }
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
