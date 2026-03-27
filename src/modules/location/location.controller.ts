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
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DeleteResult, Repository } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { Location } from './location.entity';
import { LocationService } from './location.service';
import { PatchLocationDto } from './dto/patchLocationDto';
import { CreateLocationDto } from './dto/createLocationDto';
import { AdminService } from '../admin/admin.service';
import { UserType } from '../user/user.entity';

@ApiBearerAuth()
@Controller('locations')
@ApiTags('Location')
export class LocationController {
  constructor(
    private readonly locationService: LocationService,
    private readonly adminService: AdminService,
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
  ) { }

  @ApiOperation({ summary: 'Get all locations' })
  @ApiResponse({ type: Location, status: 200 })
  @Get()
  findAll(): Promise<Location[]> {
    return this.locationRepo.find();
  }

  @ApiOperation({ summary: 'Get location by id' })
  @ApiResponse({ type: Location, status: 200 })
  @Get(':id')
  public async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ): Promise<Location> {
    const location = await this.locationRepo.findOne({ id });
    if (!location) {
      throw new HttpException(
        `Location does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return location;
  }

  @ApiOperation({ summary: 'Create location, only admin can do this.' })
  @ApiResponse({ type: Location, status: 201 })
  @Post()
  @UsePipes(ValidationPipe)
  public async create(
    @Body() data: CreateLocationDto,
    @Request() req,
  ): Promise<Location> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    // todo add created by
    const admin = this.adminService.findByAuthUserId(req.user.id);

    // todo: remove this hard coded admin id

    return this.locationService.create({ ...data });
  }

  @ApiOperation({ summary: 'Delete location' })
  @ApiResponse({ type: Location, status: 200 })
  @Delete(':id')
  public async remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Request() req,
  ): Promise<DeleteResult> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.locationRepo.delete(id);
  }

  @ApiOperation({ summary: 'Update location by fields' })
  @ApiResponse({ type: Location, status: 201 })
  @Patch(':id')
  @UsePipes(ValidationPipe)
  public async merge(
    @Body() data: PatchLocationDto,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Request() req,
  ): Promise<Location> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const admin = await this.adminService.findByAuthUserId(req.user.id);

    const existingLocation = await this.locationRepo.findOne({ id });

    if (!existingLocation) {
      throw new HttpException(
        `Location does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    existingLocation.admin = admin;

    if (data.name) {
      existingLocation.name = data.name;
    }

    if (data.qrCode) {
      existingLocation.qrCode = data.qrCode;
    }

    if (data.lat) {
      existingLocation.lat = data.lat;
    }
    if (data.long) {
      existingLocation.long = data.long;
    }

    const result = this.locationRepo.merge(existingLocation, data);
    return this.locationRepo.save(result);
  }
}
