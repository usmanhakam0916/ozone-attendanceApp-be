import {
  BadRequestException,
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
import { Repository } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { Admin } from './admin.entity';
import { AdminService } from './admin.service';
import { PatchAdminDto } from './dto/patchAdminDto';
import { CreateAdminDto } from './dto/createAdminDto';
import { FileService } from '../file/file.service';
import { UserService } from '../user/user.service';
import { User, UserType } from '../user/user.entity';
import { AppHelpers } from 'src/helpers/app.helpers';

@ApiBearerAuth()
@Controller('admins')
@ApiTags('Admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly fileService: FileService,
    private readonly userService: UserService,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  @ApiOperation({ summary: 'Get all admins' })
  @ApiResponse({ type: Admin, status: 200 })
  @Get()
  findAll(@Request() req): Promise<Admin[]> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.adminRepo.find();
  }

  @ApiOperation({ summary: 'Get admin by id' })
  @ApiResponse({ type: Admin, status: 200 })
  @Get(':id')
  public async findOne(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Request() req,
  ): Promise<Admin> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const admin = await this.adminRepo.findOne({ id });
    if (!admin) {
      throw new HttpException(
        `Admin does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return admin;
  }

  // @ApiOperation({ summary: 'Create admin' })
  // @ApiResponse({ type: Admin, status: 201 })
  // @Post()
  // @UsePipes(ValidationPipe)
  // public async create(@Body() data: CreateAdminDto): Promise<Admin> {
  //   return this.adminService.create(data);
  // }

  @ApiOperation({ summary: 'Create admin, see the secret in .env file' })
  @ApiResponse({ type: Admin, status: 201 })
  @Post('/management/:secret')
  @UsePipes(ValidationPipe)
  public async createAdminForManagement(
    @Body() data: CreateAdminDto,
    @Param('secret')
    secret: string,
  ): Promise<Admin> {
    if (secret !== process.env.MANAGEMENT_SECRET) {
      throw new HttpException(
        `You're not allowed to create admin`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.adminService.create(data);
  }

  @ApiOperation({ summary: 'Delete admin' })
  @ApiResponse({ type: Admin, status: 200 })
  @Delete(':id') // ADMIN ID
  public async remove(@Request() req) {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const { id } = req.params; // admin id

    const admin = await this.adminRepo.findOne(id, { relations: ['authUser'] });
    if (admin) {
      if (admin.authUser.id === req.user.id) {
        throw new BadRequestException("You can't delete yourself");
      }
      return this.userRepo.delete(admin.authUser.id);
    }
    // previous logic
    // const user = await this.userService.getById(req.user.id);
    // const admin = user ? await this.adminRepo.findOne(user.profileId) : null;

    // if (admin) {
    //   const delAdmin = await this.adminRepo.findOne(id);
    //   if (delAdmin) {
    //     if (delAdmin.id !== admin.id) {
    //       return this.adminRepo.delete(id);
    //     } else {
    //       throw new BadRequestException("You can't delete yourself");
    //     }
    //   } else {
    //     throw new BadRequestException('no admin exist');
    //   }
    // }
  }

  @ApiOperation({ summary: 'Update admin by fields' })
  @ApiResponse({ type: Admin, status: 201 })
  @Patch(':id')
  @UsePipes(ValidationPipe)
  public async merge(
    @Body() data: PatchAdminDto,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Request() req,
  ): Promise<Admin> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }

    const existingAdmin = await this.adminRepo.findOne({ id });

    if (!existingAdmin) {
      throw new HttpException(
        `Admin does not exist against this id :${id}`,
        HttpStatus.NOT_FOUND,
      );
    }

    if (
      // if user wants to update
      data.avatar &&
      (!existingAdmin.avatar ||
        (existingAdmin.avatar && existingAdmin.avatar.id !== data.avatar))
    ) {
      if (existingAdmin.avatar) {
        // case-1 if avatar exists
        // case-2 existingAdmin.avatar.id !== data.avatarId
        await this.fileService.deletePublicFile(existingAdmin.avatar.id);
      }

      const avatar = await this.fileService.findById(data.avatar);

      if (!avatar) {
        throw new HttpException(
          `avatar not found against this id:${data.avatar}`,
          HttpStatus.NOT_FOUND,
        );
      } else {
        existingAdmin.avatar = avatar;
      }
    }

    const user = await this.userService.getById(existingAdmin.authUser.id);
    if (data.authUser?.password) {
      existingAdmin.authUser.password = await AppHelpers.hashPassword(
        data.authUser.password,
      );
      user.password = await AppHelpers.hashPassword(data.authUser.password);
    }
    if (data.authUser?.type) {
      existingAdmin.authUser.type = data.authUser.type;
      user.type = data.authUser.type;
    }
    await this.userService.save(user);
    return this.adminRepo.save(existingAdmin);
  }
}
