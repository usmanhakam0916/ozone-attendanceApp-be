import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpService,
  HttpStatus,
  NotFoundException,
  Patch,
  Post,
  Query,
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
import {
  User,
  UserStatus,
  UserType,
  validUserStatus,
} from '../user/user.entity';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/loginDto';
import { LocalAuthGuard } from './local-auth.guard';
import { NoAuth } from './no-auth.guard';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MeQueryDto } from './dto/meDto';
import { ForgetPasswordDto } from './dto/forgetPasswordDto';
import { hotp as authenticator } from 'otplib';
import EmailService from '../email/email.service';
import { AppHelpers } from 'src/helpers/app.helpers';
import { ResetPasswordDto } from './dto/resetPasswordDto';

dotenv.config();
const otpCounter = {};

@Controller()
@ApiTags('Authentication')
export class AuthController {
  constructor(
    private userService: UserService,
    private authService: AuthService,
    private adminService: AdminService,
    private employeeService: EmployeeService,
    private readonly emailService: EmailService,
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
    console.log('workd.................');
    const user = await this.userService.getByEmail(data.email);
    if (!user) {
      throw new NotFoundException('User now found');
    }
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
      if (user.status === UserStatus.HOLD) {
        throw new HttpException(
          {
            message: `The employee is currently on hold due to pending account verification. Please coordinate with HR/Admin to proceed further.`,
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
  async me(@Req() req, @Query() query: MeQueryDto) {
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
      if (!(query.month && query.year)) {
        throw new HttpException(
          'Month and year query parameters are required.',
          HttpStatus.BAD_REQUEST,
        );
      }
      const currentYear = new Date().getFullYear(); // getMonth() returns 0-11
      if (query.year < 1990 && query.year > currentYear) {
        throw new HttpException(
          `Year cannot be greater than ${currentYear} and less than 1990`,
          HttpStatus.BAD_REQUEST,
        );
      }

      const currentMonth = new Date().getMonth() + 1; // getMonth() returns 0-11
      if (query.month < 1 && query.month > 12) {
        throw new HttpException(
          'Month must be between 1 and 12',
          HttpStatus.BAD_REQUEST,
        );
      } else if (query.month > currentMonth) {
        throw new HttpException(
          'Month cannot be of future',
          HttpStatus.BAD_REQUEST,
        );
      }

      me = await this.employeeService.findByAuthUserId(req.user.id);
      const now = new Date();
      const sort = me.attendances
        .filter((x) => x.checkInTime) // remove null checkIns
        .filter((x) => {
          const checkInDate = new Date(x.checkInTime);
          const monthTrue = checkInDate.getMonth() + 1 === Number(query.month);
          const yearTrue = checkInDate.getFullYear() === Number(query.year);
          return monthTrue && yearTrue;
        })
        .sort((a, b) => a.id - b.id);
      const last_attendnace = sort[sort.length - 1];
      me['isNightShiftLogin'] = last_attendnace
        ? last_attendnace.isNightShiftLogin
        : false;
      me.attendances = sort.sort((a, b) => {
        const dateA = new Date(a.checkInTime).getTime();
        const dateB = new Date(b.checkInTime).getTime();
        return dateB - dateA; // descending: latest first
      });

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

  @NoAuth()
  @ApiOperation({ summary: 'Forget Password' })
  @ApiResponse({ type: Object, status: 200 })
  @Post('forget-password')
  @UsePipes(ValidationPipe)
  public async forgetPassword(@Body() data: ForgetPasswordDto) {
    const user = await this.userService.getByEmail(data.email);
    if (!user) {
      throw new HttpException(`User not found.`, HttpStatus.NOT_FOUND);
    }
    const employee = await this.employeeService.findByAuthUserId(user.id);
    if (!employee) {
      throw new HttpException(`User not found.`, HttpStatus.NOT_FOUND);
    }

    if (otpCounter[employee.id.toString()]) {
      otpCounter[employee.id.toString()] += 1;
    } else {
      otpCounter[employee.id.toString()] = 1;
    }

    const otp = authenticator.generate(
      employee.id.toString(),
      otpCounter[employee.id.toString()],
    );

    this.emailService.sendMail({
      to: user.email,
      name: user.username,
      subject: 'Ozone Reset Password OTP',
      text: `${otp} is your reset password code.`,
    });

    return {
      status: 200,
      message: `OTP sent to email: ${user.email}`,
    };
  }

  @NoAuth()
  @ApiOperation({ summary: 'Reset Password' })
  @ApiResponse({ type: Object, status: 200 })
  @Post('reset-password')
  @UsePipes(ValidationPipe)
  public async resetPasswordFlow(@Body() data: ResetPasswordDto) {
    const user = await this.userService.getByEmail(data.email);
    if (!user) {
      throw new HttpException(`User not found.`, HttpStatus.NOT_FOUND);
    }

    const employee = await this.employeeService.findByAuthUserId(user.id);
    if (!employee) {
      throw new HttpException(`User not found.`, HttpStatus.NOT_FOUND);
    }

    if (!otpCounter[employee.id.toString()]) {
      throw new HttpException(
        'Invalid OTP or OTP expired',
        HttpStatus.BAD_REQUEST,
      );
    }

    const isValid = authenticator.check(
      data.otp,
      employee.id.toString(),
      otpCounter[employee.id.toString()],
    );

    if (!isValid) {
      throw new HttpException(`Invalid OTP`, HttpStatus.FORBIDDEN);
    }

    if (data.password) {
      user.password = await AppHelpers.hashPassword(data.password);
      await this.userRepo.save(user); // Saving user updates the password
      // Optionally save employee if needed, but password is usually on user entity
      return {
        status: 200,
        message: 'Password updated successfully',
      };
    }

    // else if passowrd is not sent then only otp is ment to be varified
    return {
      status: 200,
      message: 'OTP Varified successfully',
    };
  }
}
