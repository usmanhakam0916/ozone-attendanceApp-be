import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Post,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { VersionManager } from './version_manager.entity';
import { createVersionManagerDto } from './dto/createVersionManagerDTO';
import { VersionManagerService } from './version_manager.service';
import { NoAuth } from '../auth/no-auth.guard';

@Controller('versionManager')
@ApiTags('VersionManager  ')
export class VersionManageController {
  constructor(
    private readonly versionManagerService: VersionManagerService,
    @InjectRepository(VersionManager)
    private readonly versionManagerRepo: Repository<VersionManager>,
  ) { }

  @NoAuth()
  @ApiOperation({ summary: 'Add a new app version' })
  @ApiResponse({ type: VersionManager, status: 201 })
  @Post()
  @UsePipes(ValidationPipe)
  public async create(@Body() data: createVersionManagerDto, @Request() req) {
    try {
      const versionManager = new VersionManager();
      versionManager.iosVersion = data.iosVersion;
      versionManager.androidVersion = data.androidVersion;
      versionManager.isActive = true;
      const activeVersion = await this.versionManagerService.findActiveVersion();
      if (activeVersion) {
        activeVersion.isActive = false;
        await this.versionManagerRepo.save(activeVersion);
      }
      const response = await this.versionManagerRepo.save(versionManager);
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }
  @NoAuth()
  @ApiOperation({ summary: 'Get Active Version of Apps' })
  @ApiResponse({ type: VersionManager, status: 201 })
  @Get('/get-active-version')
  @UsePipes(ValidationPipe)
  public async getActive(@Request() req) {
    try {
      const response = await this.versionManagerService.findActiveVersion();
      return response;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.NOT_FOUND);
    }
  }
}
