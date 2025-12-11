import { Repository, Like } from 'typeorm';
import {
  HttpException,
  HttpService,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { OZONE_BACKEND_BASE_URL } from 'src/app.constants';
import { Attendance } from './attendance.entity';
import {
  CreateAttendanceDto,
  CreateAttendanceWithQRCodeDto,
} from './dto/createAttendanceDto';
import { UserService } from '../user/user.service';
import { User, UserType } from '../user/user.entity';
import { FileService } from '../file/file.service';
import { EmployeeService } from '../employee/employee.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { LogService } from 'src/log/log.service';
import { LocationService } from '../location/location.service';
import { Location } from '../location/location.entity';
import { AxiosResponse } from 'axios';

const moment = require('moment');
moment.createFromInputFallback = function (config) {
  // unreliable string magic, or
  config._d = new Date(config._i);
};

function getCurrentDateTime() {
  const d = new Date();
  const local = d.getTime();
  const offset = d.getTimezoneOffset() * (60 * 1000);
  const utc = new Date(local + offset);
  const riyadh = new Date(utc.getTime() + 3 * 60 * 60 * 1000);
  return moment(riyadh.toLocaleString()).format('YYYY-MM-DD HH:mm:00');
}

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly employeeService: EmployeeService,
    private readonly logsService: LogService,
    private readonly http: HttpService,
    private readonly fileService: FileService,
    private readonly locationService: LocationService,
  ) { }

  // @Cron(CronExpression.EVERY_DAY_AT_1AM)
  // async archiveRecords() {
  //   const currentDate = new Date(getCurrentDateTime());
  //   var previous = new Date(currentDate.setMonth(currentDate.getMonth() - 1));
  //   const attendances = await this.attendanceRepo.find({ isArchived: false });
  //   const filteredRecords = attendances.filter((attendance) => {
  //     if (new Date(attendance.checkInTime) < previous) {
  //       return attendance;
  //     }
  //   });
  //   const toUpdate = filteredRecords.map((item) => ({
  //     ...item,
  //     isArchived: true,
  //   }));
  //   await Promise.all(toUpdate.map((item) => this.attendanceRepo.save(item)));
  // }

  async findById(id: number): Promise<Attendance> {
    return this.attendanceRepo.findOne(id);
  }

  create = async (data: CreateAttendanceDto): Promise<Attendance> => {
    const employee = await this.employeeService.findById(data.employeeId);
    const attendance = await this.attendanceRepo.save({
      checkInTime: getCurrentDateTime(),
      locationId: data.locationId,
      employee,
    });
    return attendance;
  };

  createWithQRCode = async (data): Promise<Attendance> => {
    const attendance = await this.attendanceRepo.save({
      checkInTime: data.checkInTime,
      isNightShiftLogin: data.isNightShiftLogin,
      locationId: data.locationId,
      qrCode: data.qrCode,
      employee: data.employee,
      checkinDeviceId: data.deviceId,
      checkInId: data.checkInId ? data.checkInId : data.employee.checkInRowId,
      checkInType: data.checkInType,
      checkInFace: data.checkInFace,
    });
    return attendance;
  };

  checkPolicy = (employee) => {
    let checkInTime = getCurrentDateTime();
    let checkoutTime = getCurrentDateTime();
    // this time will be in 24 hours format

    if (employee.group) {
      const checkin = compareCheckIn(employee.group.checkinTime);
      const checkout = compareCheckOut(employee.group.checkoutTime);
      if (checkin.response) {
        checkInTime = setDateTime(checkin);
      }

      if (checkout.response) {
        checkoutTime = setDateTime(checkout);
      }
    }
    return { checkInTime, checkoutTime };
  };

  // this will check if the checkin of same day update the checkin  or create checkin
  async checkIn(employee, todaysAttendances, data, location) {
    const log = {
      employeeId: employee.id,
    };
    let res = null;
    if (process.env.IS_SYNC !== 'true') {
      res = { data: { data: { data: 1122 } } };
    }

    let { checkInTime } = this.checkPolicy(employee);
    checkInTime = data.currentTime ? data.currentTime : checkInTime;
    const sorted = todaysAttendances.sort((a, b) => {
      a - b;
    });
    const todaysLastAttendance = sorted[sorted.length - 1];
    if (
      todaysLastAttendance &&
      moment(checkInTime).isSame(
        moment(todaysLastAttendance.checkInTime),
        'minute',
      )
    ) {
      throw new HttpException(
        {
          message: `2 checkins within the same minute/time is not allowed`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    if (
      process.env.IS_SYNC === 'true' &&
      todaysAttendances.length == 0 &&
      employee.authUser.isActiveDirectory
    ) {
      res = await this.createEserviceCheckIn(employee, location, checkInTime);
      employee.checkInRowId = res?.data?.data?.data;
      await this.employeeService.save(employee);
      log['requestPayload'] = {
        badgeNo: employee.authUser.username,
        checkInTime,
        locattion: { id: location.id, name: location.name.slice(0, 45) },
      };
      log['response'] = res?.data?.data;
      log['type'] = 'in';
    } else if (
      todaysAttendances.length >= 1 &&
      process.env.IS_SYNC === 'true' &&
      employee.authUser.isActiveDirectory
    ) {
      const request = {
        AttendanceId: parseInt(employee.checkInRowId),
        S2TimeIn: moment(checkInTime).format().split('+')[0].trim(),
        Shift: 'S2',
        Time: 'In',
        EmpNo: parseInt(employee.authUser.username),
      };
      res = await this.updateCheckOut(request, location);
      log['requestPayload'] = { ...request, ...location };
      log['response'] = res.data;
      log['type'] = 'in';
    }
    console.log('here5')
    const attendance = await this.createWithQRCode({
      deviceId: data.deviceId,
      qrCode: data.qrCode,
      locationId: location.id,
      employee,
      checkInTime,
      isNightShiftLogin: data.currentTime ? true : false,
      checkInType: data.checkInType,
      checkInFace: data.checkInFace,
    });
    console.log('here6')
    log['attendanceId'] = attendance.id;
    this.logsService.createLog(log);
    return { attendance, res };
  }

  async updateCheckOut(
    data,
    location,
    location_params = {},
  ): Promise<AxiosResponse<any>> {
    if (location && data.Time != 'Both') {
      location_params[`LocationName`] = location.name.slice(0, 45);
      location_params[`Time${data.Time}Longitudes`] = parseFloat(location.long);
      location_params[`Time${data.Time}Latitudes`] = parseFloat(location.lat);
    }
    try {
      const res = await this.http
        .patch(`${OZONE_BACKEND_BASE_URL}Attendance/UpdateCheckOut/`, {
          ...data,
          ...location_params,
        })
        .toPromise();
      return res;
    } catch (error) {
      throw new HttpException(
        {
          message: `Error CheckIn/Checkout . No response from the Backend`,
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async createWithParams({ data, employee, location }): Promise<Attendance> {
    try {
      if (
        process.env.IS_SYNC === 'true' &&
        employee.authUser.isActiveDirectory
      ) {
        return this.handleRequest(data, employee, location);
      } else {
        return await this.createAttendance(
          data,
          employee,
          location,
          data.checkInId,
        );
      }
    } catch (error) {
      throw new HttpException(`${error.message}`, HttpStatus.BAD_REQUEST);
    }
  }

  async createAttendance(data, employee, location, checkInId) {
    const attendance = await this.attendanceRepo.save({
      checkInTime: data.checkInTime,
      checkInType: data.checkInType,
      checkOutType: data.checkOutType,
      checkinDeviceId: data.checkInDeviceId,
      checkoutDeviceId: data.checkOutDeviceId,
      checkoutTime: data.checkoutTime,
      isNightShiftLogin: data.isNightShiftLogin,
      locationId: location.id,
      checkoutLocation: location,
      qrCode: location.qrCode,
      employee: employee,
      checkInId,
    });
    return attendance;
  }

  async handleRequest(data, employee, location) {
    const checkInTime = moment(data.checkInTime).format().split('+')[0].trim();
    const checkOutTime = moment(data.checkoutTime)
      .format()
      .split('+')[0]
      .trim();
    const request = {
      AttendanceId: parseInt(data.checkInId),
      Shift: data.shift,
      EmpNo: parseInt(employee.authUser.username),
    };

    const location_params = {
      LocationName: location.name.slice(0, 45),
      TimeInLongitudes: parseFloat(location.long),
      TimeOutLongitudes: parseFloat(location.long),
      TimeInLatitudes: parseFloat(location.long),
      TimeOutLatitudes: parseFloat(location.lat),
    };
    if (data.shift == 'S2') {
      const res = await this.updateCheckOut(
        {
          ...request,
          Time: 'Both',
          S2TimeIn: checkInTime,
          S2TimeOut: checkOutTime,
        },
        location,
        location_params,
      );
      if (res?.data?.data?.isValid) {
        return await this.createAttendance(
          data,
          employee,
          location,
          data.checkInId,
        );
      }
    }

    if (data.shift == 'S1') {
      const checkin = await this.createEserviceCheckIn(
        employee,
        location,
        checkInTime,
      );
      await this.updateCheckOut(
        {
          ...request,
          AttendanceId: checkin?.data?.data?.data,
          Time: 'Out',
          S1Timeout: checkOutTime,
        },
        location,
        location_params,
      );
      return await this.createAttendance(
        data,
        employee,
        location,
        checkin?.data?.data?.data,
      );
    }
  }

  async createEserviceCheckIn(
    employee,
    location,
    checkInTime,
  ): Promise<AxiosResponse<any>> {
    const res = await this.http
      .post(
        `${OZONE_BACKEND_BASE_URL}Attendance/AddCheckIn/${employee.authUser.username
        }/${checkInTime}/${location.name.slice(0, 45)}/${location.long}/${location.lat
        }/`,
      )
      .toPromise();
    return res;
  }

  async checkoutLogic(existingAttendance, employee, body): Promise<Location> {
    if (!existingAttendance) {
      throw new HttpException(
        `Attendance does not exist against the provided id`,
        HttpStatus.NOT_FOUND,
      );
    }
    if (employee.isMac) {
      const mac_address: string = body.qrCode.split(':')[0];
      if (mac_address !== employee.macAddress) {
        throw new HttpException(
          `Please Use Authenticated Device To LogOut`,
          HttpStatus.NOT_FOUND,
        );
      }
    }
    const locationByQRCode = await this.locationService.findByQRCode(
      body.qrCode,
    );
    if (!locationByQRCode) {
      throw new HttpException(
        `Location does not exist against this qr code :${body.qrCode}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const location = employee.locations.find(
      (location) => locationByQRCode.id === location.id,
    );
    if (location == undefined) {
      throw new HttpException(
        `Location By QR code does not match with location by id`,
        HttpStatus.BAD_REQUEST,
      );
    }
    return location;
  }

  async syncAttendanceEService(data: any, req: any) {
    try {
      if (
        req.user.type == UserType.ADMIN &&
        process.env.IS_SYNC === 'true' &&
        req?.user?.isActiveDirectory
      ) {
        const attendance: Attendance = await this.attendanceRepo.findOne(
          data?.attendanceId,
        );
        if (attendance) {
          const res = await this.http
            .patch(
              `${OZONE_BACKEND_BASE_URL}Attendance/S2AddUpdateAttendance/${data?.employeeNo}/${data?.date}/0/${data?.S2TimeInLocation}/${data?.S2TimeOutLocation}/${data?.TimeIn}/${data?.TimeOut}`,
            )
            .toPromise();
          if (res?.data?.data?.title) {
            attendance.syncByUser = req?.user;
            attendance.syncedAt = new Date();
            await this.attendanceRepo.save(attendance);
            return { message: 'S2 time synced successfully' };
          }
        } else {
          return { error: 'Attendance not found' };
        }
      } else {
        return { error: 'You are not authorized to do this' };
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
}

function compareCheckOut(param) {
  const time = param.split(':');
  const currentTime = new Date(getCurrentDateTime());
  var response = false;
  if (
    currentTime.getHours() > time[0] ||
    (time[0] == currentTime.getHours() && currentTime.getMinutes() >= time[1])
  ) {
    response = true;
  }
  return { response, time };
}

function compareCheckIn(param) {
  const time = param.split(':');
  const currentTime = new Date(getCurrentDateTime());
  var response = false;
  if (
    currentTime.getHours() < time[0] ||
    (time[0] == currentTime.getHours() && currentTime.getMinutes() <= time[1])
  ) {
    response = true;
  }
  return { response, time };
}

function setDateTime(params) {
  let newDateTime = new Date(getCurrentDateTime());
  newDateTime = new Date(newDateTime.setHours(params.time[0]));
  newDateTime = new Date(newDateTime.setMinutes(params.time[1]));
  newDateTime = new Date(newDateTime.setSeconds(0));
  return moment(newDateTime).format('YYYY-MM-DD HH:mm:ss');
}
