import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpService,
  HttpStatus,
  Patch,
  Post,
  Req,
  Request,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { AdminService } from '../admin/admin.service';
import { EmployeeService } from '../employee/employee.service';
import * as dotenv from 'dotenv';
import { UserService } from '../user/user.service';
import { User, UserType, validUserStatus } from '../user/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/loginDto';
import { LocalAuthGuard } from './local-auth.guard';
import { NoAuth } from './no-auth.guard';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { AppHelpers } from 'src/helpers/app.helpers';

dotenv.config();

@Controller()
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private adminService: AdminService,
    private employeeService: EmployeeService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly http: HttpService,
  ) { }

  @NoAuth()
  @UseGuards(LocalAuthGuard)
  @ApiOperation({ summary: 'Login user' })
  @UsePipes(ValidationPipe)
  @Post('auth/login')
  async login(@Body() data: LoginDto) {
    const user = await this.userService.getByBatchNo(data.username);
    await this.authService.checkVersion(data);
    if (user) {
      // if  device id is null get the device id from params and udpate the record
      if (user.deviceId == null) {
        user.deviceId = data.deviceId;
        user.deviceType = data.deviceType;
        try {
          await this.userRepo.save(user);
        } catch (error) {
          const user = await this.userRepo.findOne({
            where: {
              deviceId: data.deviceId,
            },
          });

          throw new HttpException(
            {
              message: `This device is already registered against user ${user.username}`,
            },
            HttpStatus.BAD_REQUEST,
          );
        }
      } else if (
        data?.deviceType !== 'web' &&
        user.deviceId !== data.deviceId &&
        user.type !== UserType.ADMIN &&
        user.type !== UserType.MANAGER &&
        user.type !== UserType['HR-MANAGER'] &&
        !user.multiDevice
      ) {
        throw new HttpException(
          {
            message: `Please Login From registered device`,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      throw new HttpException(
        { message: `Invalid username or password` },
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      user.type === UserType.EMPLOYEE
      // &&
      // process.env.IS_SYNC==='true'
      // &&
      // user.isActiveDirectory
    ) {
      // let res = null;
      // try {
      //   if (process.env.IS_SYNC ==='true'&& user.isActiveDirectory) {
      //     res = await this.http
      //       .get(
      //         `${OZONE_BACKEND_BASE_URL}Accounts/Users/GetEmployeeDetails/${data.username}`,
      //       )
      //       .toPromise();
      //   }
      // } catch (error) {
      //   console.log(error, error.message, 'catch!');
      // }

      // if (
      //   !res?.data?.data?.data?.emp_No &&
      //   process.env.IS_SYNC==='true' &&
      //   user.isActiveDirectory
      // ) {
      //   throw new HttpException(
      //     {
      //       message: `Invalid Batch number.`,
      //     },
      //     HttpStatus.NOT_FOUND,
      //   );
      // }

      // user.status =
      //   userStatusHash[res?.data?.data?.data?.emp_Status || 'Active'];

      // user.status =
      // userStatusHash['Active'];

      //update initial data
      // const recentData = res?.data?.data?.data || {};
      // const initialDataObject = this.employeeService.createInitialDataObject({
      //   ...JSON.parse(user.initialData),
      //   ...recentData,
      // });
      // user.initialData = JSON.stringify({
      //   ...initialDataObject,
      //   ...recentData,
      // });

      // await this.userRepo.save(user);
      // var expired: boolean = false;
      // if (
      //   user.status === UserStatus.RESIGNED ||
      //   user.status === UserStatus.TERMINATED
      // ) {
      //   const initialData = JSON.parse(user.initialData);
      //   const lastWorkingDate = Date.parse(initialData['lastWorkingDate']);
      //   const currentDate = new Date().getTime();
      //   if (isNaN(lastWorkingDate) || lastWorkingDate < currentDate) {
      //     expired = true;
      //   }
      // }
      if (
        !validUserStatus.includes(user.status)
        //   ||
        // expired
      ) {
        throw new HttpException(
          {
            message: `Employee is no more active contact to HRM`,
            status: user.status,
          },
          HttpStatus.UNAUTHORIZED,
        );
      }
    }
    return await this.authService.login(user);
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'get id of user' })
  @Get('me/me/me')
  async me(@Req() req) {
    let me = null;
    if (
      req.user &&
      (req.user.type === 'admin' ||
        req.user.type === 'manager' ||
        req.user.type === 'hr-manager' ||
        req.user.type === 'supervisor')
    ) {
      me = await this.adminService.findByAuthUserId(req.user.id);
    } else if (req.user && req.user.type === 'employee') {
      me = await this.employeeService.findByAuthUserId(req.user.id);
      const sort = me.attendances.sort((a, b) => a.id - b.id);
      const last_attendnace = sort[sort.length - 1];
      me['isNightShiftLogin'] = last_attendnace
        ? last_attendnace.isNightShiftLogin
        : false;
      me.attendances.sort(AppHelpers.getDateTimeSorter('checkInTime'));
      me['IS_VPN_DETECTION'] = process.env.IS_VPN_DETECTION;
    }
    return me;
  }

  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user through CMS' })
  @ApiResponse({ status: 200 })
  @Patch('auth/deactivate-user')
  public async deactivateUserByCMS(
    @Request() req: any,
  ): Promise<{ message: string }> {
    try {
      const user = req.user;
      return await this.authService.deactivateUserFromCMS(user);
    } catch (error) {
      throw new HttpException(
        { message: error?.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
