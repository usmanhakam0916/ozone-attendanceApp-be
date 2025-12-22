import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as dotenv from 'dotenv';
import { UserService } from '../user/user.service';
import { VersionManagerService } from '../versionManager/version_manager.service';
import { AppHelpers } from 'src/helpers/app.helpers';
import { User, UserStatus, UserType } from '../user/user.entity';
import { EmployeeService } from '../employee/employee.service';
import { Attendance } from '../attendance/attendance.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Location } from '../location/location.entity';

dotenv.config();

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
    private versionManagerService: VersionManagerService,
    private employeeService: EmployeeService,
    @InjectRepository(Attendance)
    private attendenceRepo: Repository<Attendance>,
    @InjectRepository(Location)
    private locationRepo: Repository<Location>,
  ) { }

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.getByEmail(email);
    const result = AppHelpers.comparePassword(pass, user.password);
    if (user && result) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const targetEmployee = (await this.employeeService.findByAuthUserId(user.id));
    const todayAttendancesArray = await this.attendenceRepo.find({ where: { checkInTime: new Date().toISOString().split('T')[0], employee: { id: targetEmployee.id } } });
    return {
      access_token: this.jwtService.sign({ username: user.username, email: user.email }),
      role: user.type,
      IS_VPN_DETECTION: process.env.IS_VPN_DETECTION,
      attendanceType: targetEmployee?.attendanceType,
      attendances: todayAttendancesArray,
      locations: targetEmployee.locations,
      attendanceRadius: targetEmployee?.attendanceRadius,
    };
  }

  async checkVersion(data) {
    if (data.deviceType == 'web') {
    } else {
      const current_version =
        await this.versionManagerService.findActiveVersion();
      const version_matched = checkVersion(
        data.version,
        current_version,
        data.deviceType,
      );
      if (!version_matched) {
        if (data.deviceType === 'ios') {
          if (data.osVersion) {
            if (parseInt(data.osVersion) > 12) {
              throw new HttpException(
                `1. Open the App Store.\n2. Tap your profile icon at the top of the screen.\n3. Scroll to see pending updates.\n4. Tap Update next to AGH-TAA app to update.`,
                HttpStatus.BAD_REQUEST,
              );
            } else {
              throw new HttpException(
                `1. Open the App Store.\n2. Tap updates icon at the bottom of the screen.\n3. Scroll to see pending updates.\n4. Tap Update next to AGH-TAA app to update.`,
                HttpStatus.BAD_REQUEST,
              );
            }
          } else {
            throw new HttpException(
              `1. Open the App Store. 2. Tap your profile icon at the top of the screen. 3. Scroll to see pending updates. 4. Tap Update next to AGH-TAA app to update. OR 1. Open the App Store. 2. Tap updates icon at the bottom of the screen .3. Scroll to see pending updates. 4. Tap Update next to AGH-TAA app to update.`,
              HttpStatus.BAD_REQUEST,
            );
          }
        } else if (data.deviceType === 'android') {
          throw new HttpException(
            'App update is available on Store. Kindly update your App from respective store to get latest features.',
            HttpStatus.BAD_REQUEST,
          );
        }
      }
    }
  }

  async deactivateUserFromCMS(user: User) {
    try {
      if (UserType?.EMPLOYEE === user.type) {
        await this.usersService.save({
          ...user,
          status: UserStatus.INACTIVE,
        } as User);
        return {
          message: 'Account deactivate successfully',
          status: HttpStatus.OK,
        };
      } else {
        throw new HttpException('Invalid User', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(
        { message: error?.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
const checkVersion = (appVersion, responseVersion, deviceType) => {
  if (!appVersion) {
    return false;
  }
  if (deviceType === 'android') {
    if (process.env.IS_ANDROID_EXACT_VERSION_MATCH === 'true') {
      return appVersion >= responseVersion.androidVersion;
    }
  } else if (process.env.IS_IOS_EXACT_VERSION_MATCH === 'true') {
    return appVersion >= responseVersion.iosVersion;
  }
  responseVersion =
    deviceType == 'android'
      ? responseVersion.androidVersion
      : responseVersion.iosVersion;
  const currentVersion = appVersion.split('.');
  const newVersion = responseVersion.split('.');
  if (parseInt(currentVersion[0]) < parseInt(newVersion[0])) {
    return false;
  } else if (parseInt(currentVersion[1]) < parseInt(newVersion[1])) {
    return false;
  } else {
    return true;
  }
};
