import { Repository } from 'typeorm';
import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Request,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { Employee } from '../employee/employee.entity';
import moment = require('moment');

@ApiBearerAuth()
@Controller('dashboard')
@ApiTags('Dashboard')
export class DashboardController {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
  ) { }

  @Get(':locationId/date')
  public async index(
    @Param('locationId') locationId: string,
    @Request() req,
  ) {
    try {
      const date: string = req?.query?.date
      const query = {};
      if (locationId !== 'all') {
        query['locationId'] = locationId;
      }
      const qb = this.employeeRepo
        .createQueryBuilder('employee')
        .leftJoinAndSelect('employee.authUser', 'user')
        .where("user.deviceType IN ('android', 'ios')");
      if (!req.user.isActiveDirectory) {
        qb.andWhere('user.isActiveDirectory=:isActiveDirectory', {
          isActiveDirectory: false,
        });
      }
      if (locationId !== 'all') {
        qb.leftJoin('employee.locations', 'location');
        qb.andWhere('location.id =:locationId', {
          locationId: parseInt(locationId),
        });
      }
      const employees = await qb.getMany();
      let androidUsers = 0;
      let iphoneUsers = 0;

      employees.forEach((employee) => {
        if (employee.authUser.deviceType == 'android') {
          androidUsers += 1;
        }
        if (employee.authUser.deviceType == 'ios') {
          iphoneUsers += 1;
        }
      });
      const checkInTime = moment(date).format('YYYY-MM-DD');
      const todaysCheckIns = [];
      const todaysCheckouts = [];
      let checkInTimeCounts = 0;
      let checkoutTimeCounts = 0;
      let faceCheckIns = 0;
      let qrCodeCheckIns = 0;
      let faceCheckOuts = 0;
      let qrCodeCheckOuts = 0;
      let adminCheckIns = 0;
      let adminCheckouts = 0;
      const attendancesQuery = this.attendanceRepo
        .createQueryBuilder('attendance')
        .where(
          `(attendance.checkInTime like '${checkInTime}%' or attendance.checkoutTime like '${checkInTime}%') and (attendance.checkInType IN ('Face', 'QR Code') or attendance.checkOutType IN ('Face', 'QR Code') )`,
        )
        .andWhere('attendance.isArchived = :isArchived', { isArchived: false });
      if (!req.user.isActiveDirectory) {
        attendancesQuery
          .leftJoinAndSelect('attendance.employee', 'employee')
          .leftJoinAndSelect('employee.authUser', 'user')
          .andWhere('user.isActiveDirectory=:isActiveDirectory', {
            isActiveDirectory: false,
          });
      }
      if (locationId !== 'all') {
        attendancesQuery.andWhere('attendance.locationId =:locationId', {
          locationId,
        });
      }
      const attendances = await attendancesQuery.getMany();
      for (let i = 0; i < 24; i++) {
        let checkInTimeCount = 0;
        let checkoutTimeCount = 0;
        attendances.forEach((attendance) => {
          if (
            attendance.checkInTime.includes(
              `${checkInTime} ${i?.toString()?.length === 1 ? `0${i}` : i}`,
            )
          ) {
            if (attendance.checkInType == 'Face') {
              faceCheckIns += 1;
            } else if (attendance.checkInType == 'QR Code') {
              qrCodeCheckIns += 1;
            } else {
              adminCheckIns += 1;
            }
            checkInTimeCount += 1;
          }
          if (
            attendance.checkoutTime.includes(
              `${checkInTime} ${i?.toString()?.length === 1 ? `0${i}` : i}`,
            )
          ) {
            if (attendance.checkOutType == 'Face') {
              faceCheckOuts += 1;
            } else if (attendance.checkOutType == 'QR Code') {
              qrCodeCheckOuts += 1;
            } else {
              adminCheckouts += 1;
            }
            checkoutTimeCount += 1;
          }
        });
        checkInTimeCounts += checkInTimeCount;
        todaysCheckIns.push(checkInTimeCount);
        checkoutTimeCounts += checkoutTimeCount;
        todaysCheckouts.push(checkoutTimeCount);
      }
      return {
        checkInTimeCounts,
        checkoutTimeCounts,
        checkInTimes: todaysCheckIns,
        checkoutTimes: todaysCheckouts,
        androidUsers,
        iphoneUsers,
        qrCodeCheckIns,
        qrCodeCheckOuts,
        faceCheckIns,
        faceCheckOuts,
        adminCheckIns,
        adminCheckouts,
      };
    } catch (error) {
      throw new HttpException(
        { message: error?.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
