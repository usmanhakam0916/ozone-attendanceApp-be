import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
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

import { User } from './user.entity';
import { UserService } from './user.service';
import { CreateHouseKeepingDto } from './dto/createUserDto';

@ApiBearerAuth()
@Controller('users')
@ApiTags('User')
export class UserController {
  constructor(
    private readonly userService: UserService,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  @ApiOperation({
    summary: 'Create housekeeping user, see the secret in .env file',
  })
  @ApiResponse({ type: User, status: 201 })
  @Post('/house-keeping/:secret')
  @UsePipes(ValidationPipe)
  public async createHousekeeping(
    @Body() data: CreateHouseKeepingDto,
    @Param('secret')
    secret: string,
  ): Promise<User> {
    if (secret !== process.env.MANAGEMENT_SECRET) {
      throw new HttpException(
        `You're not allowed to create admin`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    return this.userService.createHouseKeeping(data);
  }
}
