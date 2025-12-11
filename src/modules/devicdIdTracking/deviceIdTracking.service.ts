import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DeviceIdTracking } from "./entities/deviceIdTracking.entity";
import { CreateDeviceIdTrackingDto } from "./dto/create-device-id-tracking.dto";
import { User } from "../user/user.entity";

@Injectable()
export class DeviceIdTrackingService {
  constructor(
    @InjectRepository(DeviceIdTracking)
    private readonly deviceIdTrackingRepo: Repository<DeviceIdTracking>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) { }

  async create(body: CreateDeviceIdTrackingDto) {
    try {
      const user = await this.userRepo.findOne(body?.amendForId)
      const amendBy = await this.userRepo.findOne(body?.amendById)
      const deviceIdTracking = new DeviceIdTracking()
      deviceIdTracking.deviceId = body.deviceId
      deviceIdTracking.user = user
      deviceIdTracking.amendBy = amendBy
      return await this.deviceIdTrackingRepo.save(deviceIdTracking)
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }


  async findPaginatedData(take: number, skip: number, q: any) {
    try {
      const qb = this.deviceIdTrackingRepo.createQueryBuilder('dit')
        .leftJoinAndSelect('dit.user', 'user')
        .leftJoinAndSelect('dit.amendBy', 'amendBy')
        .where('dit."isArchive" is false')
      if (q?.employeeId) {
        qb.andWhere('(user.username=:employeeId OR dit.deviceId=:employeeId OR user.deviceId=:employeeId)', { employeeId: q?.employeeId })
      }
      const [deviceIdTracking, totalDeviceIdTracking] = await qb
        .orderBy('dit.createdAt', 'DESC')
        .take(take).skip(skip)
        .getManyAndCount()
      return { deviceIdTracking, totalDeviceIdTracking }
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
