import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UsePipes,
  ValidationPipe,
  HttpService,
  Req,
} from '@nestjs/common';
import { hotp as authenticator } from 'otplib';
import { DeleteResult, Repository, getConnection, getManager } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { AttendanceType, Employee } from './employee.entity';
import { EmployeeService } from './employee.service';
import { PatchEmployeeDto } from './dto/patchEmployeeDto';
import { CreateEmployeeDto } from './dto/createEmployeeDto';
import { SignupEmployeeDto } from './dto/signupEmployeeDto';
import { FileService } from '../file/file.service';
import EmailService from '../email/email.service';
import { OtpVerifyDto } from './dto/otpVerifyDto';
import { SetPasswordDto } from './dto/setPasswordDto';
import * as userEntity from '../user/user.entity';
import { Location } from '../location/location.entity';
import { approveDto } from './dto/approveDto';
import { NoAuth } from '../auth/no-auth.guard';
import { PostRegisterFaceIdDto } from './dto/postRegisterFaceIdDto';
import { OZONE_BACKEND_BASE_URL } from 'src/app.constants';
import { LocationService } from '../location/location.service';

import { ChangePasswordDto } from '../auth/dto/loginDto';
import { UserService } from '../user/user.service';
import employeeLocations from './employee_locations';
import locationsWithLatLong from './locations';
import employees_2021_05_17 from './employees_2021_05_17';
import { GroupPolicyService } from '../groupPolicy/groupPolicy.service';
import { AppHelpers } from 'src/helpers/app.helpers';
import { Department } from '../departments/entities/department.entity';
import { DeviceIdTrackingService } from '../devicdIdTracking/deviceIdTracking.service';
import { CreateDeviceIdTrackingDto } from '../devicdIdTracking/dto/create-device-id-tracking.dto';

const otpCounter = {};

@ApiBearerAuth()
@Controller('employees')
@ApiTags('Employee')
export class EmployeeController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly emailService: EmailService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    private readonly locationService: LocationService,
    private readonly groupPolicyService: GroupPolicyService,
    private readonly deviceIdTrackingService: DeviceIdTrackingService,
    @InjectRepository(userEntity.User)
    private readonly userRepo: Repository<userEntity.User>,
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
    @InjectRepository(Employee)
    private readonly employeeRepo: Repository<Employee>,
    private readonly http: HttpService,
  ) { }

  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ type: Employee, status: 200 })
  @NoAuth()
  @Get('upload-images/users/employees/to-s3/one-time')
  async uplaodToS3() {
    await this.employeeService.uploadProfilePicture();
  }

  @ApiOperation({ summary: 'Get all employees' })
  @ApiResponse({ type: Employee, status: 200 })
  @Get(':take/:skip')
  async findAll(
    @Param(
      'take',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    take: number,

    @Param(
      'skip',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    skip: number,
    @Req() req,
  ): Promise<{ result: Employee[]; total: number }> {
    try {
      if (req.user.type == userEntity.UserType.EMPLOYEE) {
        throw new HttpException(
          `Only admin can use this api`,
          HttpStatus.UNAUTHORIZED,
        );
      }
      if (take > 50) {
        throw new HttpException(
          `"take" cannot be greater than 50`,
          HttpStatus.BAD_REQUEST,
        );
      }
      const { name, deviceType, departmentId } = req.query;
      const query = this.employeeRepo
        .createQueryBuilder('employee')
        .leftJoinAndSelect('employee.authUser', 'user')
        .leftJoinAndSelect('employee.avatar', 'avatar')
        .skip(skip)
        .take(take)
        .where('user.type=:userType', {
          userType: userEntity.UserType.EMPLOYEE,
        });
      if (!req.user.isActiveDirectory) {
        query.andWhere('user.isActiveDirectory=:isActiveDirectory', {
          isActiveDirectory: false,
        });
      }
      if (name) {
        query.andWhere(`"user"."initialData" <> ''`)
          .andWhere(`"user"."initialData"::text LIKE '{%'`)
          .andWhere(
            `("user"."initialData"::jsonb ->> 'emP_Name' ILIKE :name
      OR "user"."initialData"::jsonb ->> 'Name' ILIKE :name)`,
            { name: `%${name}%` },
          );
      }
      if (deviceType && deviceType != 'all') {
        query.andWhere('user.deviceType=:deviceType', { deviceType });
      }
      if (departmentId) {
        query.andWhere('employee."departmentId"=:departmentId', {
          departmentId,
        });
      }
      const response = await query.getManyAndCount();
      return { result: response[0], total: response[1] };
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: 'Search Employees by badge no' })
  @ApiResponse({ type: Employee, status: 200 })
  @Get('/search')
  async findByBadge(@Req() req): Promise<Employee[]> {
    if (req.user.type == userEntity.UserType.EMPLOYEE) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const result = await this.employeeService.searchEmployees(req.query);
    return result;
  }

  @NoAuth()
  @ApiOperation({ summary: 'Add employee departments' })
  @Get('/add/employee/departments')
  addEmployeeDepartments() {
    return this.employeeService.addEmployeeDepartments();
  }

  @NoAuth()
  @ApiOperation({ summary: 'Bulk create employees coming on May 2021' })
  @ApiResponse({ status: 200 })
  @Post('bulk-create-2021-05-17/:secret')
  public async bulkCreate_2021_05_17(
    @Param('secret')
    secret: string,
  ) {
    if (secret !== process.env.MANAGEMENT_SECRET) {
      throw new HttpException(`Unauthorized`, HttpStatus.UNAUTHORIZED);
    }

    const users: userEntity.User[] = [];
    const employees = [];
    const rawEmployees = employees_2021_05_17;

    const encryptedPassword = await AppHelpers.hashPassword('12345');
    rawEmployees.forEach((item) =>
      users.push({
        type: userEntity.UserType.EMPLOYEE,
        username: item['Employee No'].toString(),
        password: encryptedPassword,
        status: item['Status'] as userEntity.UserStatus,
        initialData: JSON.stringify(item),
      } as userEntity.User),
    );

    const dbUsers = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(userEntity.User)
      .values(users)
      .execute();

    dbUsers.raw.forEach((item) =>
      employees.push({
        attendanceRadius: 100,
        authUser: item,
      }),
    );

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Employee)
      .values(employees)
      .execute();

    employees.forEach((item) => {
      const rawEmp = rawEmployees.find(
        (e) =>
          e['Employee No'] ==
          JSON.parse(item.authUser.initialData)['Employee No'], // light equality check == added intentionally
      );

      if (!rawEmp) {
        throw new HttpException(
          `Batch number not found :${JSON.parse(item.authUser.initialData)['Employee No']
          }`,
          HttpStatus.NOT_FOUND,
        );
      }
    });

    return { status: 200, message: 'ok' };
  }

  @NoAuth()
  @ApiOperation({ summary: 'Bulk create employees and locations' })
  @ApiResponse({ status: 200 })
  @Post('bulk-create/:secret')
  public async bulkCreate(
    @Param('secret')
    secret: string,
  ) {
    if (secret !== process.env.MANAGEMENT_SECRET) {
      throw new HttpException(`Unauthorized`, HttpStatus.UNAUTHORIZED);
    }

    const users: userEntity.User[] = [];
    const employees = [];
    const rawEmployees = employeeLocations;
    const mergedLocations = locationsWithLatLong.map((item) => ({
      name: item.name,
      lat: Number(item.lat),
      long: Number(item.long),
      qrCode: item.qrCode,
    }));

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Location)
      .values(mergedLocations)
      .execute();

    const encryptedPassword = await AppHelpers.hashPassword('12345');
    rawEmployees.forEach((item) =>
      users.push({
        type: userEntity.UserType.EMPLOYEE,
        username: item['Employee No'].toString(),
        password: encryptedPassword,
        status: item['Status'] as userEntity.UserStatus,
        initialData: JSON.stringify(item),
      } as userEntity.User),
    );

    const dbUsers = await getConnection()
      .createQueryBuilder()
      .insert()
      .into(userEntity.User)
      .values(users)
      .execute();

    dbUsers.raw.forEach((item) =>
      employees.push({
        attendanceRadius: 100,
        authUser: item,
      }),
    );

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into(Employee)
      .values(employees)
      .execute();

    const allLocations = await this.locationService.getAll();
    const locations = [];

    employees.forEach((item) => {
      const rawEmp = rawEmployees.find(
        (e) =>
          e['Employee No'] ==
          JSON.parse(item.authUser.initialData)['Employee No'], // light equality check == added intentionally
      );

      if (!rawEmp) {
        throw new HttpException(
          `Batch number not found :${JSON.parse(item.authUser.initialData)['Employee No']
          }`,
          HttpStatus.NOT_FOUND,
        );
      }

      const locs = rawEmp['Assigned Location']
        .split(',')
        .map((l) => l.trim().toLowerCase());

      const locObjects = allLocations.filter((l) => {
        return locs.includes(l.name.trim().toLowerCase());
      });

      locObjects.forEach((l) => {
        locations.push({
          employeeId: item.id,
          locationId: l.id,
        });
      });
    });

    await getConnection()
      .createQueryBuilder()
      .insert()
      .into('employee_locations_location')
      .values(locations)
      .execute();

    return { status: 200, message: 'ok' };
  }

  @NoAuth()
  @ApiOperation({ summary: 'Truncate data' })
  @ApiResponse({ status: 200 })
  @Post('truncate/:secret')
  public async truncate(
    @Param('secret')
    secret: string,
  ) {
    if (secret !== process.env.MANAGEMENT_SECRET) {
      throw new HttpException(`Unauthorized`, HttpStatus.UNAUTHORIZED);
    }

    const entityManager = getManager();
    entityManager.query(
      `
      TRUNCATE TABLE "admin" CASCADE;
      TRUNCATE TABLE "user" CASCADE;
      TRUNCATE TABLE "employee" CASCADE;
      TRUNCATE TABLE "location" CASCADE;
      TRUNCATE TABLE "attendance" CASCADE;
      TRUNCATE TABLE "employee_locations_location" CASCADE;
    `,
      [],
    );

    return { status: 200, message: 'ok' };
  }

  @ApiOperation({ summary: 'Get employee by id' })
  @ApiResponse({ type: Employee, status: 200 })
  @Get(':id')
  public async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Req() req,
  ) {
    if (req.user.type == userEntity.UserType.EMPLOYEE) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new HttpException(
        `Employee does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    // let res = null;
    // if (process.env.IS_SYNC==='true' && employee.authUser.isActiveDirectory) {
    //   res = await this.http
    //     .get(
    //       `${OZONE_BACKEND_BASE_URL}Accounts/Users/GetEmployeeDetails/${employee.authUser.username}`,
    //     )
    //     .toPromise();

    //   if (!res?.data?.data?.data?.emp_No) {
    //     throw new HttpException(
    //       {
    //         message: `Invalid Batch number.`,
    //       },
    //       HttpStatus.NOT_FOUND,
    //     );
    //   }
    // }

    // return { user: employee, ozoneUser: res?.data || {} };
    const ozoneUser = employee?.authUser?.initialData
      ? { data: { data: JSON.parse(employee?.authUser?.initialData) } }
      : {};
    await employee?.department;
    return { user: employee, ozoneUser };
  }

  @NoAuth()
  @ApiOperation({ summary: 'Employee Signup' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post('signup')
  @UsePipes(ValidationPipe)
  public async signup(@Body() data: SignupEmployeeDto) {
    try {
      let existingUser = await this.userRepo.findOne({
        where: { username: data.userName },
      });
      if (existingUser) {
        return {
          message: `Employee already exist against this user name :${data.userName}`,
        };
      }


      existingUser = await this.userRepo.findOne({
        where: { email: data.email },
      });
      if (existingUser) {
        return {
          message: `Employee already exist against this email :${data.email}`,
        };
      }

      const newEmploye = new Employee();

      newEmploye.attendanceRadius = 100;

      newEmploye.attendanceType = AttendanceType.MULTIPLE;

      if (data.macAddress) {
        newEmploye.macAddress = data.macAddress;
      }

      if (data.isMac) {
        newEmploye.isMac = data.isMac;
      }

      if (data.groupId) {
        const policyGroup = await this.groupPolicyService.findById(
          data.groupId,
        );
        newEmploye.group = policyGroup;
      } else if (data.groupId == null) {
        newEmploye.group = null;
      }

      let user = new userEntity.User();
      user.email = data.email;
      user.type = userEntity.UserType.EMPLOYEE;
      user.status = userEntity.UserStatus.HOLD;
      user.qrCodeCheckInAllowed = true;
      user.username = data.userName;
      user.multiDevice = false;
      user.faceCheckInAllowed = true;
      user.password = await AppHelpers.hashPassword(data.password);

      if (data?.locations?.length == 0) {
        newEmploye.locations = [];
      } else if (data?.locations?.length > 0) {
        const locations = await this.locationService.findByIds(data.locations);
        newEmploye.locations = locations;
      }

      const department: Department = await this.departmentRepo.findOne(
        data?.departmentId,
      );

      let initialData;
      initialData = {
        department_Name: department?.name || '',
        Department: department?.name || '',
        emP_Name: data?.employeeName,
        Name: data?.employeeName,
        emp_Status: user.status.charAt(0).toUpperCase(),
        position_Name: '',
        Position: '',
      };
      initialData = JSON.stringify(initialData);
      user.initialData = initialData;
      newEmploye.department = department;
      user = await this.userRepo.save(user);
      newEmploye.authUser = user;
      const verificationOtp = Math.floor(1000 + Math.random() * 9000);

      const finalResult = await this.employeeRepo.save(newEmploye);


      this.resendOtp(finalResult.id);

      return finalResult;
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @NoAuth()
  @ApiOperation({ summary: 'Create Employee' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post()
  @UsePipes(ValidationPipe)
  public async create(@Body() data: CreateEmployeeDto) {
    try {
      const existingUser = await this.userRepo.findOne({
        where: { username: data.employeeNumber },
      });
      if (existingUser) {
        return {
          message: `Employee already exist against this id :${data.employeeNumber}`,
        };
      }

      const newEmploye = new Employee();
      if (data.attendanceRadius) {
        newEmploye.attendanceRadius = data.attendanceRadius;
      }

      if (data.attendanceType) {
        newEmploye.attendanceType = data.attendanceType as AttendanceType;
      }
      if (data.macAddress) {
        newEmploye.macAddress = data.macAddress;
      }

      if (data.isMac) {
        newEmploye.isMac = data.isMac;
      }

      if (data.groupId) {
        const policyGroup = await this.groupPolicyService.findById(
          data.groupId,
        );
        newEmploye.group = policyGroup;
      } else if (data.groupId == null) {
        newEmploye.group = null;
      }
      let user = new userEntity.User();
      let initialData;
      user.type = data.userType;
      user.status = data.status;
      user.qrCodeCheckInAllowed = data.qrCodeCheckInAllowed;
      user.username = data.employeeNumber;
      user.multiDevice = data.multiDevice;
      user.faceCheckInAllowed = data.faceCheckInAllowed;
      if (data?.locations?.length == 0) {
        newEmploye.locations = [];
      } else if (data?.locations?.length > 0) {
        const locations = await this.locationService.findByIds(data.locations);
        newEmploye.locations = locations;
      }
      const department: Department = await this.departmentRepo.findOne(
        data?.departmentId,
      );
      initialData = {
        department_Name: department.name,
        Department: department.name,
        emP_Name: data?.employeeName,
        Name: data?.employeeName,
        emp_Status: data.status.charAt(0).toUpperCase(),
        position_Name: data?.designation,
        Position: data?.designation,
      };
      initialData = JSON.stringify(initialData);
      user.initialData = initialData;
      newEmploye.department = department;
      user = await this.userRepo.save(user);
      newEmploye.authUser = user;
      return this.employeeRepo.save(newEmploye);
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getCreateDepartment(empData) {
    try {
      let existingDepartment = null;
      if (empData['department_Name']) {
        const departmentName = AppHelpers.removeExtraSpaces(
          empData['department_Name'],
        );
        if (departmentName) {
          existingDepartment = await this.departmentRepo.findOne({
            where: { name: departmentName },
          });
          if (!existingDepartment) {
            existingDepartment = new Department();
            existingDepartment.name = departmentName;
            existingDepartment = await this.departmentRepo.save(
              existingDepartment,
            );
          }
        }
      }
      return existingDepartment;
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  @NoAuth()
  @ApiOperation({ summary: 'OTP verification' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post('otp/verify')
  @UsePipes(ValidationPipe)
  public async otpVerify(@Body() data: OtpVerifyDto): Promise<Employee> {
    const employee = await this.employeeService.findById(data.employeeId);

    const isValid = authenticator.check(
      data.otp,
      data.employeeId.toString(),
      otpCounter[data.employeeId.toString()],
    );

    if (isValid) {
      const user = await this.userRepo.findOne({ id: employee.authUser.id });
      user.status = userEntity.UserStatus.ACTIVE;
      employee.authUser.status = userEntity.UserStatus.ACTIVE;
      await this.userRepo.save(user);
    } else {
      throw new HttpException(`Invalid OTP`, HttpStatus.NOT_FOUND);
    }

    return this.employeeRepo.save(employee);
  }

  @NoAuth()
  @ApiOperation({ summary: 'Resend OTP' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post('otp/resend/:id')
  @UsePipes(ValidationPipe)
  public async resendOtp(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new HttpException(`User not found.`, HttpStatus.NOT_FOUND);
    }
    const res = await this.userService.getByEmail(employee.authUser.email);
    if (!res) {
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
      to: res.email,
      name: res.username,
      subject: 'Ozone Employee Registration OTP',
      text: `${otp} is your registration code.`,
    });

    return {
      status: 201,
      message: `OTP is resent on this email: ${res.email}`,
    };
  }

  @ApiOperation({ summary: 'approve employee only admin can do it' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post('approve')
  @UsePipes(ValidationPipe)
  public async approve(
    @Body() data: approveDto,
    @Req() req,
  ): Promise<Employee> {
    if (req.user.type !== 'admin') {
      throw new HttpException(`Unauthorized`, HttpStatus.UNAUTHORIZED);
    }

    const employee = await this.employeeService.findById(data.employeeId);

    const user = await this.userRepo.findOne({ id: employee.authUser.id });
    user.status = userEntity.UserStatus.ACTIVE;
    user.password = await AppHelpers.hashPassword(data.password);
    employee.authUser.status = userEntity.UserStatus.ACTIVE;
    employee.authUser.password = await AppHelpers.hashPassword(data.password);
    await this.userRepo.save(user);

    return this.employeeRepo.save(employee);
  }

  @NoAuth()
  @ApiOperation({ summary: 'Set Password' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post('set-password')
  @UsePipes(ValidationPipe)
  public async resetPassword(@Body() data: SetPasswordDto): Promise<Employee> {
    const employee = await this.employeeService.findById(data.employeeId);

    if (!employee) {
      throw new HttpException(
        `User not found against this id: ${data.employeeId}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const isValid = authenticator.check(
      data.otp,
      data.employeeId.toString(),
      otpCounter[data.employeeId.toString()],
    );

    if (isValid) {
      // todo: password should be encrypted
      const user = await this.userRepo.findOne({ id: employee.authUser.id });
      user.password = await AppHelpers.hashPassword(data.password);
      employee.authUser.password = await AppHelpers.hashPassword(data.password);
      await this.userRepo.save(user);
    } else {
      throw new HttpException(`Invalid OTP`, HttpStatus.NOT_FOUND);
    }

    return employee;
  }

  @ApiOperation({ summary: 'Delete employee, only admin can do it' })
  @ApiResponse({ type: Employee, status: 200 })
  @Delete(':id')
  public async remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Req() req,
  ): Promise<DeleteResult> {
    if (req.user.type !== userEntity.UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const employee = await this.employeeService.findById(id);

    if (!employee) {
      throw new HttpException(
        `Employee does not exist against this id: ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const authUserId = employee.authUser.id;

    await this.employeeRepo.delete(id);
    return this.userRepo.delete(authUserId);
  }

  @ApiOperation({ summary: 'Delete user, only admin can do it' })
  @ApiResponse({ type: Employee, status: 200 })
  @Delete('user/:id')
  public async removeUser(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Req() req,
  ): Promise<DeleteResult> {
    if (req.user.type !== userEntity.UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    return this.userRepo.delete(id);
  }

  @ApiOperation({ summary: 'Register Face ID' })
  @ApiResponse({ type: Employee, status: 201 })
  @Patch('/register-face-id/:id')
  @UsePipes(ValidationPipe)
  public async registerFaceId(
    @Body() data: PostRegisterFaceIdDto,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ): Promise<Employee> {
    const existingEmployee = await this.employeeRepo.findOne({ id });
    //await existingEmployee.avatar;
    if (!existingEmployee) {
      throw new HttpException(
        `Employee does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    const faceId = await this.fileService.findById(data.faceId);

    if (!faceId) {
      throw new HttpException(
        `Profile picture file not found against this id:${data.faceId}`,
        HttpStatus.NOT_FOUND,
      );
    } else {
      existingEmployee.avatar = faceId;
    }
    const attendance = await this.employeeRepo.save(existingEmployee);
    const sort = attendance.attendances.sort((a, b) => a.id - b.id);
    const last_attendnace = sort[sort.length - 1];
    attendance['isNightShiftLogin'] = last_attendnace
      ? last_attendnace.isNightShiftLogin
      : false;
    attendance.attendances.sort(AppHelpers.getDateTimeSorter('checkInTime'));
    return attendance;
  }

  @ApiOperation({ summary: 'Update employee by fields' })
  @ApiResponse({ type: Employee, status: 201 })
  @Patch(':id')
  @UsePipes(ValidationPipe)
  public async merge(
    @Body() data: PatchEmployeeDto,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ): Promise<Employee> {
    const existingEmployee = await this.employeeRepo.findOne({ id });
    if (!existingEmployee) {
      throw new HttpException(
        `Employee does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (data.attendanceRadius) {
      existingEmployee.attendanceRadius = data.attendanceRadius;
    }

    if (data.attendanceType) {
      existingEmployee.attendanceType = data.attendanceType as AttendanceType;
    }
    if (data.macAddress) {
      existingEmployee.macAddress = data.macAddress;
    }

    if (data.isMac || existingEmployee.isMac) {
      existingEmployee.isMac = data.isMac;
    }

    if (data.groupId) {
      const policyGroup = await this.groupPolicyService.findById(data.groupId);
      existingEmployee.group = policyGroup;
    } else if (data.groupId == null && existingEmployee.group) {
      existingEmployee.group = null;
    }

    if (data.language) {
      existingEmployee.language = data.language;
    }

    const user = existingEmployee.authUser;
    let initialData = JSON.parse(user?.initialData);
    if (data.authUser) {
      if (data?.authUser?.password) {
        user.password = await AppHelpers.hashPassword(data?.authUser?.password);
      } else {
        Object.keys(data.authUser).forEach((key) => {
          user[`${key}`] = data.authUser[`${key}`];
        });
      }
      // user.password = data.authUser.password;
      // user.faceCheckInAllowed = data.authUser.faceCheckInAllowed;
      // user.qrCodeCheckInAllowed = data.authUser.qrCodeCheckInAllowed;
    }
    user.multiDevice = data.multiDevice;
    if (data?.locations?.length == 0) {
      existingEmployee.locations = [];
    } else if (data?.locations?.length > 0) {
      const locations = await this.locationService.findByIds(data.locations);
      existingEmployee.locations = locations;
    }
    if (!data?.authUser?.password) {
      const department: Department = await this.departmentRepo.findOne(
        data?.departmentId,
      );
      initialData.department_Name = department?.name ?? initialData.department_Name;
      initialData.Department = department?.name ?? initialData.Department;
      initialData.emP_Name = data?.employeeName ?? initialData.emP_Name;
      initialData.Name = data?.employeeName ?? initialData.Name;
      initialData.position_Name = data?.designation ?? initialData.position_Name;
      initialData.Position = data?.designation ?? initialData.Position;
      initialData = JSON.stringify(initialData);
      user.initialData = initialData;
      existingEmployee.department = department;
    }
    await this.userRepo.save(user);
    return this.employeeRepo.save(existingEmployee);
  }

  @ApiOperation({ summary: 'Assign employee location' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post(':employeeId/:locationId')
  @UsePipes(ValidationPipe)
  public async EmployeeLocation(
    @Param(
      'employeeId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    employeeId: number,
    @Param(
      'locationId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    locationId: number,
  ): Promise<Employee> {
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new HttpException(
        `Employee doesn't exist against this id: ${employeeId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    const location = await this.locationService.findById(locationId);
    if (!location) {
      throw new HttpException(
        `Location doesn't exist against this id: ${locationId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    employee.locations.push(location);

    return this.employeeRepo.save(employee);
  }

  @ApiOperation({ summary: 'Delete employee location' })
  @ApiResponse({ type: Employee, status: 200 })
  @Delete(':employeeId/:locationId')
  public async del(
    @Param(
      'employeeId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    employeeId: number,
    @Param(
      'locationId',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    locationId: number,
  ): Promise<Employee> {
    const employee = await this.employeeService.findById(employeeId);
    if (!employee) {
      throw new HttpException(
        `Employee doesn't exist against this id: ${employeeId}`,
        HttpStatus.NOT_FOUND,
      );
    }
    employee.locations = employee.locations.filter(
      (item) => item.id !== locationId,
    );
    return this.employeeRepo.save(employee);
  }

  @NoAuth()
  @ApiOperation({ summary: 'Update employee status' })
  @ApiResponse({ type: Employee, status: 201 })
  @Patch('/status/:batchNo/:status')
  @UsePipes(ValidationPipe)
  public async updateStatus(
    @Param('batchNo')
    batchNo: string,
    @Param('status')
    status: string,
  ): Promise<Employee> {
    if (!userEntity.userStatusArray.includes(status as any)) {
      throw new HttpException(`Invalid Status`, HttpStatus.BAD_REQUEST);
    }
    const existingEmployee = await this.employeeService.getEmployeeByBatchNo(
      batchNo,
    );

    if (!existingEmployee) {
      throw new HttpException(
        `Employee does not exist against this Batch number :${batchNo}`,
        HttpStatus.NOT_FOUND,
      );
    }

    existingEmployee.authUser.status = status as userEntity.UserStatus;
    const user = await this.userRepo.findOne({
      id: existingEmployee.authUser.id,
    });
    user.status = status as userEntity.UserStatus;
    await this.userRepo.save(user);
    return this.employeeRepo.save(existingEmployee);
  }

  @ApiOperation({ summary: 'Update Password.' })
  @ApiResponse({ type: Employee, status: 201 })
  @Post('change-password')
  @UsePipes(ValidationPipe)
  public async changePassword(@Body() data: ChangePasswordDto, @Req() req) {
    const user = await this.userService.getByEmail(req.user.email);

    if (!(await AppHelpers.comparePassword(data.oldPassword, user.password))) {
      throw new HttpException(
        { message: `Invalid password.` },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (!data.newPassword) {
      throw new HttpException(
        { message: `Password cannot be empty.` },
        HttpStatus.BAD_REQUEST,
      );
    }

    user.password = await AppHelpers.hashPassword(data.newPassword);

    await this.userRepo.save(user);

    return { status: 200, message: 'New password is set successfully.' };
  }

  @ApiOperation({ summary: 'remove DeviceId from User' })
  @ApiResponse({ type: Employee, status: 200 })
  @Delete('/user/remove_device/:auth_user_id')
  public async removeDevice(
    @Param('auth_user_id')
    auth_user_id: string,
    @Req() req,
  ) {
    if (req.user.type == userEntity.UserType.EMPLOYEE) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const user = await this.userService.getById(parseInt(auth_user_id));
    if (!user) {
      throw new HttpException(`Employee not found`, HttpStatus.UNAUTHORIZED);
    }
    const createDeviceIdTracking = new CreateDeviceIdTrackingDto();
    createDeviceIdTracking.deviceId = user.deviceId;
    createDeviceIdTracking.amendForId = user?.id;
    createDeviceIdTracking.amendById = req?.user?.id;
    await this.deviceIdTrackingService.create(createDeviceIdTracking);
    user.deviceId = null;
    user.deviceType = null;
    await this.userRepo.save(user);
    return user;
  }

  @ApiOperation({ summary: 'remove faceId from Employee' })
  @ApiResponse({ type: Employee, status: 200 })
  @Delete('/user/remove_face_id/:employee_id')
  public async removeFaceId(
    @Param('employee_id')
    employee_id: string,
    @Req() req,
  ) {
    if (req.user.type == userEntity.UserType.EMPLOYEE) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const user = await this.employeeService.findById(parseInt(employee_id));
    if (!user) {
      throw new HttpException(`Employee not found`, HttpStatus.UNAUTHORIZED);
    }
    user.avatar = null;
    await this.employeeRepo.save(user);
    return user;
  }

  // @ApiOperation({ summary: 'Get employee by batchNo' })
  // @ApiResponse({ type: Employee, status: 200 })
  // @Get('get-by-batch-number/:batchNo/:get/:by/:batch')
  // public async findOneByBatchId(
  //   @Param('batchNo')
  //   batchNo: string,
  //   @Param('get')
  //   get: string,
  //   @Param('by')
  //   by: string,
  //   @Param('batch')
  //   batch: string,
  //   @Req() req,
  // ) {
  //   if (req.user.type == UserType.EMPLOYEE) {
  //     throw new HttpException(
  //       `Only admin can use this api`,
  //       HttpStatus.UNAUTHORIZED,
  //     );
  //   }

  //   const user = await this.userService.getByBatchNo(batchNo);
  //   if (!user) {
  //     throw new HttpException(
  //       `Employee does not exist against this batchNo :${batchNo}`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }
  //   const employee = await this.employeeRepo.findOne({ authUser: user });

  //   if (!employee) {
  //     throw new HttpException(
  //       `Employee does not exist against this batchNo :${batchNo}`,
  //       HttpStatus.NOT_FOUND,
  //     );
  //   }

  //   let res = { data: { data: { data: { emp_No: '' } } } };
  //   if (process.env.IS_SYNC==='true' && employee.authUser.isActiveDirectory) {
  //     res = await this.http
  //       .get(
  //         `${OZONE_BACKEND_BASE_URL}Accounts/Users/GetEmployeeDetails/${employee.authUser.username}`,
  //       )
  //       .toPromise();

  //     if (!res?.data?.data?.data?.emp_No) {
  //       throw new HttpException(
  //         {
  //           message: `Invalid Batch number.`,
  //         },
  //         HttpStatus.NOT_FOUND,
  //       );
  //     } else {
  //       const authUser = employee.authUser;
  //       const recentData = res?.data?.data?.data || {};
  //       const initialDataObject = this.employeeService.createInitialDataObject({
  //         ...JSON.parse(authUser.initialData),
  //         ...recentData,
  //       });
  //       authUser.initialData = JSON.stringify({
  //         ...initialDataObject,
  //         ...recentData,
  //       });
  //       await this.userRepo.save(authUser);
  //     }
  //   }

  //   return {
  //     data: [{ user: employee, ozoneUser: res?.data || {} }],
  //     total: 1,
  //   };
  // }
}

// todo: employees pagination
// todo: employees search filters
