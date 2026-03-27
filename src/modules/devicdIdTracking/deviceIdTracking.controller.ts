import {
  Controller,
  Get,
  Param, Request,
} from '@nestjs/common';
import { DeviceIdTrackingService } from './deviceIdTracking.service';
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";

@ApiBearerAuth()
@ApiTags('Device Id Tracking')
@Controller('deviceIdTracking')
export class DeviceIdTrackingController {
  constructor(private readonly deviceIdTrackingService: DeviceIdTrackingService) { }

  @Get(':take/:skip')
  findPaginatedData(@Param('take') take: number, @Param('skip') skip: number, @Request() req) {
    return this.deviceIdTrackingService.findPaginatedData(take, skip, req?.query);
  }
}
