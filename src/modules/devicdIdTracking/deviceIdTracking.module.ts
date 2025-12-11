import { Module } from '@nestjs/common';
import { DeviceIdTrackingService } from './deviceIdTracking.service';
import { DeviceIdTrackingController } from './deviceIdTracking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeviceIdTracking } from "./entities/deviceIdTracking.entity";
import { User } from "../user/user.entity";

@Module({
  imports: [TypeOrmModule.forFeature([DeviceIdTracking, User])],
  controllers: [DeviceIdTrackingController],
  providers: [DeviceIdTrackingService],
})
export class DeviceIdTrackingModule { }
