import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFile,
  UseInterceptors,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { getRepository, Repository } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { Attendance } from './attendance.entity';
import { AttendanceService } from './attendance.service';
import { UpdateTimeDto } from './dto/patchAttendanceDto';
import {
  CheckoutDto,
  CreateAttendanceDto,
  CreateAttendanceWithQRCodeDto,
  createAttendanceWithParamsDto,
} from './dto/createAttendanceDto';
import { FileService } from '../file/file.service';
import { EmployeeService } from '../employee/employee.service';
import ObjectsToCsv from 'objects-to-csv';
import { LocationService } from '../location/location.service';
import { AttendanceType } from '../employee/employee.entity';
import { UserType } from '../user/user.entity';
import { AppHelpers } from 'src/helpers/app.helpers';
import { FileInterceptor } from '@nestjs/platform-express';
import { faceCheckOutDto } from './dto/faceCheckOut.dto';
import { FaceMatchHelpers } from '../../helpers/faceMatch.helpers';
import { Request } from 'express'
import * as moment from 'moment';

(moment as any).createFromInputFallback = function (config: any) {
  // unreliable string magic, or
  config._d = new Date(config._i);
};

@ApiBearerAuth()
@Controller('attendances')
@ApiTags('Attendance')
export class AttendanceController {
  constructor(
    private readonly attendanceService: AttendanceService,
    private readonly employeeService: EmployeeService,
    private readonly fileService: FileService,
    @InjectRepository(Attendance)
    private readonly attendanceRepo: Repository<Attendance>,
    private readonly locationService: LocationService,
  ) { }

  @ApiOperation({ summary: 'Get Current Date Time' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get('current-time')
  currentTime(): string {
    return AppHelpers.getCurrentDateTime();
  }

  @ApiOperation({ summary: 'Get all attendances' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get()
  findAll(): Promise<Attendance[]> {
    return this.attendanceRepo.find({ isArchived: false });
  }

  @ApiOperation({ summary: 'Get all attendances' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get('get/all/of/different/device/ids/:take/:skip')
  async findDifferentDeviceId(
    @Param('take') take: number,
    @Param('skip') skip: number,
    @Req() req: Request,
  ) {
    const qb = this.attendanceRepo
      .createQueryBuilder('a')
      .leftJoinAndSelect('a.employee', 'employee')
      .leftJoinAndSelect('employee.authUser', 'authUser')
      .where('a."isArchived" is false')
      .andWhere('a."checkoutDeviceId" is not null')
      .andWhere('a."checkinDeviceId"!=a."checkoutDeviceId"');
    if (req.query?.employeeId) {
      qb.andWhere(
        '(authUser.username=:employeeId OR a."checkinDeviceId"=:employeeId OR a."checkoutDeviceId"=:employeeId)',
        { employeeId: req.query?.employeeId },
      );
    }
    const attendances = [];
    const [finalAttendances, totalAttendances] = await qb
      .orderBy('a.checkInTime', 'DESC')
      .take(take)
      .skip(skip)
      .getManyAndCount();
    for (const attendance of finalAttendances) {
      attendance['checkInDeviceIdOwner'] =
        await this.employeeService.findByDeviceId(attendance.checkinDeviceId);
      attendance['checkoutDeviceIdOwner'] =
        await this.employeeService.findByDeviceId(attendance.checkoutDeviceId);
      attendances.push(attendance);
    }
    return { attendances, totalAttendances };
  }

  @ApiOperation({ summary: 'Generate csv' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get('/generate_csv')
  async generateCSV(@Req() req: Request) {
    try {
      const { badgeNo, departmentId } = req.query;

      const qb = getRepository(Attendance)
        .createQueryBuilder('Attendance')
        .where('Attendance.isArchived = false')
        .leftJoin('Attendance.employee', 'employee')
        .leftJoinAndSelect('employee.authUser', 'authUser')
        .leftJoin('Attendance.location', 'location')
        .leftJoin('Attendance.checkoutLocation', 'checkoutLocation')
        .select([
          'Attendance.id',
          'Attendance.checkInTime',
          'Attendance.checkoutTime',
          'location.name',
          'checkoutLocation.name',
          'employee.id',
          'authUser.initialData',
        ]);
      if (badgeNo) {
        qb.andWhere('authUser.username=:username', { username: badgeNo });
      }
      if (departmentId) {
        qb.andWhere('employee."departmentId"=:departmentId', {
          departmentId,
        });
      }
      const result = await qb.orderBy('Attendance.id', 'DESC').getMany();
      return await generate_csv(result);
    } catch (err) {
      throw new HttpException(`${err.message}`, HttpStatus.NOT_FOUND);
    }
  }

  @ApiOperation({ summary: 'Get all attendances with data' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get('with-data/:take/:skip')
  async findAllWithData(
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
    @Req() req: any,
  ) {
    if (req.user?.type == UserType.EMPLOYEE) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { badgeNo, departmentId } = req.query;
    const qb = getRepository(Attendance)
      .createQueryBuilder('Attendance')
      .where('Attendance.isArchived = false')
      .leftJoinAndSelect('Attendance.employee', 'employee')
      .leftJoinAndSelect('employee.authUser', 'authUser')
      .leftJoinAndSelect('Attendance.location', 'location')
      .leftJoinAndSelect('Attendance.checkoutLocation', 'checkoutLocation');
    if (!req.user.isActiveDirectory) {
      qb.andWhere('authUser.isActiveDirectory=:isActiveDirectory', {
        isActiveDirectory: false,
      });
    }
    if (badgeNo) {
      qb.andWhere('authUser.username=:username', { username: badgeNo });
    }
    if (departmentId) {
      qb.andWhere('employee."departmentId"=:departmentId', {
        departmentId,
      });
    }
    const [result, total] = await qb
      .orderBy('Attendance.id', 'DESC')
      .skip(skip)
      .take(take)
      .getManyAndCount();
    return { result, total };
  }

  @ApiOperation({ summary: 'Get employee attendances with data' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get('employees/:id')
  async findEmployeeAttendanceWithData(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const employee = await this.employeeService.findById(id);
    if (!employee) {
      throw new HttpException(
        `Employee does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return getRepository(Attendance)
      .createQueryBuilder('Attendance')
      .leftJoinAndSelect('Attendance.location', 'location')
      .where('Attendance.employeeId = :employeeId', { employeeId: id })
      .getMany();
  }

  @ApiOperation({ summary: 'Get attendance by id' })
  @ApiResponse({ type: Attendance, status: 200 })
  @Get(':id')
  public async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ): Promise<Attendance> {
    const attendance = await this.attendanceRepo.findOne({ id });
    if (!attendance) {
      throw new HttpException(
        `Attendance does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return attendance;
  }

  @ApiOperation({ summary: 'Create attendance with QR Code' })
  @ApiResponse({ type: Attendance, status: 201 })
  @Post('with-qr-code')
  @UsePipes(ValidationPipe)
  public async createWithQRCode(
    @Body() data: CreateAttendanceWithQRCodeDto,
    @Req() req: Request,
  ) {
    return await this.runCheckInLogic(req, data);
  }

  @ApiOperation({ summary: 'Check-out' })
  @ApiResponse({ type: Attendance, status: 201 })
  @Patch('check-out/:id')
  @UsePipes(ValidationPipe)
  public async checkout(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() body: CheckoutDto,
    @Req() req: any,
  ): Promise<Attendance> {
    const employee = await this.employeeService.findByAuthUserId(req.user.id);
    const existingAttendance = await this.attendanceRepo.findOne({ id });
    //const todaysAttendances = getTodaysAttendances(employee, body.currentTime);

    const location = await this.attendanceService.checkoutLogic(
      existingAttendance,
      employee,
      body,
    );
    let { checkoutTime } = this.attendanceService.checkPolicy(employee);
    checkoutTime = body.currentTime ? body.currentTime : checkoutTime;
    if (process.env.IS_SYNC === 'true' && employee.authUser.isActiveDirectory) {
      const Shift = getShift(employee, existingAttendance);
      let params = {
        Shift: `S${Shift}`,
        AttendanceId: parseInt(employee.checkInRowId),
        EmpNo: parseInt(employee.authUser.username),
      };
      const checkoutTimeForBackend = moment(checkoutTime)
        .format()
        .split('+')[0]
        .trim();
      params[`S${Shift}Timeout`] = checkoutTimeForBackend;
      const res = await this.attendanceService.updateCheckOut(
        {
          ...params,
          Time: 'Out',
        },
        location,
      );
    }
    existingAttendance.checkoutTime = checkoutTime;
    existingAttendance.checkoutLocation = location;
    existingAttendance.checkoutDeviceId = body.deviceId;
    existingAttendance.checkOutType = body.checkOutType;
    const attendance = await this.attendanceRepo.save(existingAttendance);

    return attendance;
  }

  @ApiOperation({ summary: 'Check-out with face Id' })
  @ApiResponse({ type: Attendance, status: 201 })
  @UseInterceptors(FileInterceptor('file'))
  @Patch('check-out-face/:id')
  @UsePipes(ValidationPipe)
  public async checkOutWithFaceId(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Body() body: faceCheckOutDto,
    @Req() req: any,
    @UploadedFile() file: Express.Multer.File,
  ): Promise<Attendance> {
    try {
      const employee = await this.employeeService.findByAuthUserId(req.user.id);
      const existingAttendance = await this.attendanceRepo.findOne({ id });
      const location = await this.attendanceService.checkoutLogic(
        existingAttendance,
        employee,
        body,
      );
      let { checkoutTime } = this.attendanceService.checkPolicy(employee);
      checkoutTime = body.currentTime ? body.currentTime : checkoutTime;
      const uploadedImage = await this.fileService.uploadFileToS3(
        file,
        `Attendance-${new Date().toLocaleString('default', { month: 'long' })}`,
      );
      const does_face_match = await FaceMatchHelpers.compareFaces(
        employee.avatar.key,
        uploadedImage.Key,
      );
      if (does_face_match) {
        if (process.env.IS_SYNC === 'true' && employee.authUser.isActiveDirectory) {
          const Shift = getShift(employee, existingAttendance);
          let params = {
            Shift: `S${Shift}`,
            AttendanceId: parseInt(employee.checkInRowId),
            EmpNo: parseInt(employee.authUser.username),
          };
          const checkoutTimeForBackend = moment(checkoutTime)
            .format()
            .split('+')[0]
            .trim();
          params[`S${Shift}Timeout`] = checkoutTimeForBackend;
          const res = await this.attendanceService.updateCheckOut(
            {
              ...params,
              Time: 'Out',
            },
            location,
          );
        }
        existingAttendance.checkoutTime = checkoutTime;
        existingAttendance.checkoutLocation = location;
        existingAttendance.checkoutDeviceId = body.deviceId;
        existingAttendance.checkOutType = body.checkOutType;
        existingAttendance.checkOutFace = uploadedImage.Location;
        const attendance = await this.attendanceRepo.save(existingAttendance);
        return attendance;
      } else {
        throw new HttpException('face does not match', HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: 'Create attendance with Face ID' })
  @ApiResponse({ type: Attendance, status: 201 })
  @Post('')
  @UsePipes(ValidationPipe)
  @UseInterceptors(FileInterceptor('file'))
  public async create(
    @Body() data: CreateAttendanceDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    try {
      const employee = await this.employeeService.findById(data.employeeId);
      if (!employee) {
        throw new HttpException(
          `Employee does not exist against this id :${data.employeeId}`,
          HttpStatus.NOT_FOUND,
        );
      }
      const location = await this.locationService.findById(data.locationId);
      const todaysAttendances = getTodaysAttendances(employee);
      handleAllowedCheckins(employee, todaysAttendances, data);
      const uploadedImage = await this.fileService.uploadFileToS3(
        file,
        `Attendance-${new Date().toLocaleString('default', { month: 'long' })}`,
      );
      const does_face_match = await FaceMatchHelpers.compareFaces(
        employee.avatar.key,
        uploadedImage.Key,
      );
      if (does_face_match) {
        data['checkInFace'] = file.path;
        const { attendance, res } = await this.attendanceService.checkIn(
          employee,
          todaysAttendances,
          { ...data, checkInFace: uploadedImage.Location },
          location,
        );
        return { ...attendance, rowId: res?.data?.data?.data };
      } else {
        throw new HttpException(`Face does not match`, HttpStatus.BAD_REQUEST);
      }
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  @ApiOperation({ summary: 'Update attendance time' })
  @ApiResponse({ type: Attendance, status: 201 })
  @Patch('/time/:id')
  @UsePipes(ValidationPipe)
  public async updateTime(
    @Body() data: UpdateTimeDto,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Req() req,
  ): Promise<Attendance> {
    if (req.user.role == UserType.SUPERVISOR) {
      throw new HttpException(
        'You are not authorized to do this',
        HttpStatus.FORBIDDEN,
      );
    }

    const existingAttendance = await this.attendanceRepo.findOne(
      { id },
      { relations: ['employee'] },
    );
    if (!existingAttendance) {
      throw new HttpException(
        `Attendance does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    await SyncTime(existingAttendance, data, this.attendanceService);
    if (data.checkInTime) {
      existingAttendance.checkInTime = data.checkInTime;
      existingAttendance.checkInType = data.checkInType;
      existingAttendance.checkinDeviceId = data.checkInDeviceId;
    }

    if (data.checkOutTime) {
      existingAttendance.checkoutTime = data.checkOutTime;
      existingAttendance.checkOutType = data.checkOutType;
      existingAttendance.checkoutDeviceId = data.checkOutDeviceId;
    }

    const attendance = await this.attendanceRepo.save(existingAttendance);

    return attendance;
  }

  @ApiOperation({ summary: 'create new Attedance By Params' })
  @ApiResponse({ type: Attendance, status: 201 })
  @Post('/create_attendance')
  @UsePipes(ValidationPipe)
  public async createAttendance(
    @Body() data: createAttendanceWithParamsDto,
    @Req() req,
  ) {
    const location = await this.locationService.findById(data.locationId);
    const employee = await this.employeeService.findById(data.employeeId);

    if (req.user.role == UserType.SUPERVISOR) {
      throw new HttpException(
        'You are not authorized to do this',
        HttpStatus.FORBIDDEN,
      );
    }

    if (location && employee) {
      // create attendance locally
      return await this.attendanceService.createWithParams({
        data,
        employee,
        location,
      });
    } else {
      throw new HttpException(
        `location or employee not valid`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // todo: fetch working hours from the main db on password set

  async runCheckInLogic(req, data) {
    const employee = await this.employeeService.findByAuthUserId(req.user.id);
    const todaysAttendances = getTodaysAttendances(employee, data.currentTime);
    handleAllowedCheckins(employee, todaysAttendances, data);
    const location = await this.checkLocation(data);
    const { attendance, res } = await this.attendanceService.checkIn(
      employee,
      todaysAttendances,
      data,
      location,
    );
    return { ...attendance, rowId: res?.data?.data?.data };
  }

  async checkLocation(data) {
    const location_ids = Array.isArray(data.locationId)
      ? data.locationId
      : [data.locationId];
    const allLocations = await this.locationService.findByIds(location_ids);
    var location: any = allLocations.filter(
      (location) => location.qrCode === data.qrCode,
    );
    if (location.length == 0) {
      throw new HttpException(
        `Location By QR code does not match with location by id`,
        HttpStatus.BAD_REQUEST,
      );
    } else {
      location = location[0];
    }
    return location;
  }

  @ApiOperation({ summary: 'create new Attendance In EService' })
  @ApiResponse({ type: Attendance, status: 201 })
  @Patch('/sync/attendance/eService')
  @UsePipes(ValidationPipe)
  public syncAttendanceEService(@Body() data: any, @Req() req) {
    return this.attendanceService.syncAttendanceEService(data, req);
  }
}

function getTodaysAttendances(employee, date = null) {
  const currentTime = date ? date : AppHelpers.getCurrentDateTime();
  return employee.attendances.filter((attendance) =>
    moment(currentTime).isSame(moment(attendance.checkInTime), 'day'),
  );
}

async function SyncTime(existingAttendance, body_params, attendanceService) {
  const employee = existingAttendance.employee;
  if (
    existingAttendance.checkInId &&
    process.env.IS_SYNC === 'true' &&
    employee.authUser.isActiveDirectory
  ) {
    const Shift = getShift(employee, existingAttendance);
    if (body_params.checkInTime) {
      const params = { AttendanceId: parseInt(existingAttendance.checkInId) };
      params[`S${Shift}TimeIn`] = formatDate(body_params.checkInTime);
      params['Time'] = 'In';
      params['Shift'] = `S${Shift}`;
      params['EmpNo'] = parseInt(employee.authUser.username);
      console.log(params, 'check in time changing');
      const res = await attendanceService.updateCheckOut(params);
    }

    if (body_params.checkOutTime) {
      const params = { AttendanceId: parseInt(existingAttendance.checkInId) };
      params[`S${Shift}TimeOut`] = formatDate(body_params.checkOutTime);
      params['Time'] = 'Out';
      params['Shift'] = `S${Shift}`;
      params['EmpNo'] = parseInt(employee.authUser.username);

      const res = await attendanceService.updateCheckOut(params);
    }
  } else {
  }
}

function formatDate(date) {
  return moment(date).format().split('+')[0].trim();
}

function getShift(employee, existingAttendance) {
  const matchingAttendances = getTodaysAttendances(
    employee,
    moment(existingAttendance.checkInTime),
  );
  let Shift = 1;
  if (matchingAttendances.length > 1) {
    const ids = matchingAttendances.map((at) => at.id);
    const index = ids.sort().findIndex((id) => id == existingAttendance.id);
    Shift = index > 0 ? 2 : 1;
  }
  return Shift;
}

function handleAllowedCheckins(employee, todaysAttendances, data) {
  if (
    employee.attendanceType === AttendanceType.SINGLE &&
    todaysAttendances.length
  ) {
    throw new HttpException(
      `You're not allowed to check in more than once in a day.`,
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (
    employee.attendanceType === AttendanceType.DOUBLE &&
    todaysAttendances.length >= 2
  ) {
    throw new HttpException(
      `You're not allowed to check in more than twice in a day.`,
      HttpStatus.UNAUTHORIZED,
    );
  }

  if (employee.isMac) {
    const mac_address: string = data.qrCode.split(':')[0];
    if (employee.macAddress != mac_address) {
      throw new HttpException(
        `Please Check In Using the authenitcated device`,
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}

async function generate_csv(data) {
  const items = [];
  data.forEach((item) => {
    const initialData = item.employee
      ? JSON.parse(item?.employee?.authUser?.initialData)
      : {};
    items.push({
      'Attendance Id': item.id,
      'Employee No': initialData ? initialData['Employee No'] : '',
      'Employee Name': initialData['Name'] || '',
      Department: initialData['Department'] || '',
      'Check-in Time': item.checkInTime,
      'CheckOut Time': item.checkoutTime,
      'Check-in Location': item.location.name,
      'CheckOut Location': item.checkoutLocation
        ? item.checkoutLocation.name
        : item.location.name,
    });
  });
  const loopIteration = Math.ceil(items.length / 50000);
  const file_name = `${new Date().getTime()}.csv`;
  for (const index of Array.from({ length: loopIteration }, (v, i) => i)) {
    let start = index == 0 ? 0 : index * 50000 + 1;
    let end = (index + 1) * 50000;
    let item = items.slice(start, end);
    if (index == 0) {
      await new ObjectsToCsv(item).toDisk(`./public/${file_name}`);
    } else {
      await new ObjectsToCsv(item).toDisk(`./public/${file_name}`, {
        append: true,
      });
    }
  }

  return file_name;
}
