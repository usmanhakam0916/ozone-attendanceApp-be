import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import csv = require('csv-parser');
import * as fs from 'fs';
import { AppHelpers } from 'src/helpers/app.helpers';
import { Department } from 'src/modules/departments/entities/department.entity';
import { Employee } from 'src/modules/employee/employee.entity';
import { User, UserStatus, UserType } from 'src/modules/user/user.entity';
import { Repository } from 'typeorm';

@Injectable()
export class SeederService {
  constructor(
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) { }

  console() {
    console.log('seeder working correctly');
  }

  readFile = (filename) => {
    const result = [];
    return new Promise((resolve, reject) => {
      try {
        fs.createReadStream(filename)
          .pipe(csv())
          .on('data', (data) => result.push(data))
          .on('end', () => {
            resolve(result);
          });
      } catch (error) {
        reject(error);
      }
    });
  };
  async parse(fileName) {
    const data = await this.readFile(fileName);
    return data;
  }

  async addLocations() {
    console.log('start add location seeder');
    const data: any = await this.parse('riyada_file.csv');
    let index = 1;
    console.log(data[0]);
    for (const item of data) {
      console.log(index);
      let num = item?.ID?.replace(/[-\s]/g, '');
      const findUser = await this.userRepo.findOne({
        where: { username: `${num}${item?.COMPANY?.toUpperCase()[0]}` },
      });
      if (findUser) {
        console.log(num, item?.ID);
        console.log('user Already exist against this id: ' + item?.ID, num);
      } else {
        let employee = new Employee();
        let user = new User();
        user.username = `${num}${item?.COMPANY?.toUpperCase()[0]}`;
        user.password = await AppHelpers.hashPassword('12345');
        user.type = UserType.EMPLOYEE;
        user.status = UserStatus.ACTIVE;
        user.isActiveDirectory = false;
        user.company = item?.COMPANY?.toUpperCase();
        user.initialData = `{"Employee No":"${num}","Name":"${item?.NAME
          }","Position":"HOUSE KEEPING ${item?.COMPANY?.toUpperCase()}","Department":"HOUSE KEEPING","Branch":"AGH (${item?.Branch
          })","emp_No":"${num}","emP_Name":"${item?.NAME
          }","position_Name":"HOUSE KEEPING ${item?.COMPANY?.toUpperCase()}","department_Name":"HOUSE KEEPING","location_Name":"AGH (${item?.Branch
          })","company_id":"${item.ID}"}`;
        user = await this.userRepo.save(user);
        let depertment: Department;
        if (item?.Branch === 'khobar') {
          depertment = await this.departmentRepo.findOne({
            where: { name: 'housekeeping - khobar' },
          });
        } else if (item?.Branch === 'dammam') {
          depertment = await this.departmentRepo.findOne({
            where: { name: 'housekeeping - dammam' },
          });
        } else if (item?.Branch === 'hofuf') {
          depertment = await this.departmentRepo.findOne({
            where: { name: 'housekeeping - hofuf' },
          });
        } else if (item?.Branch === 'jubail') {
          depertment = await this.departmentRepo.findOne({
            where: { name: 'housekeeping - jubail' },
          });
        } else if (item?.Branch === 'wafa') {
          depertment = await this.departmentRepo.findOne({
            where: { name: 'housekeeping - wafa' },
          });
        } else if (item?.Branch === 'amc') {
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
      }
      index++;
    }
  }

  async encryptPasswords() {
    try {
      console.log('Seeder start for password encrypt')
      const users = await this.userRepo.find()
      let index = 0
      for (const item of users) {
        index += 1
        console.log(index)
        const encryptPasswords: string = await AppHelpers.hashPassword(item.password);
        item.password = encryptPasswords
        await this.userRepo.save(item)
      }
      console.log('Seeder end for password encrypt')
    } catch (error) {
      console.log(error)
    }
  }
}
