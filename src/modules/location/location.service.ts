import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Location } from './location.entity';
import { Admin } from '../admin/admin.entity';
import { CreateLocationDto } from './dto/createLocationDto';

@Injectable()
export class LocationService {
  constructor(
    @InjectRepository(Location)
    private readonly locationRepo: Repository<Location>,
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
  ) { }
  async getAll(): Promise<Location[]> {
    return this.locationRepo.find();
  }
  async findById(id: number): Promise<Location> {
    return this.locationRepo.findOne(id);
  }
  async findByQRCode(qrCode: string): Promise<Location> {
    return this.locationRepo.findOne({ qrCode });
  }

  async findByIds(ids: number[]): Promise<Location[]> {
    const res = await this.locationRepo
      .createQueryBuilder('location')
      .where('location.id IN (:...ids)', { ids: ids })
      .getMany();
    return res;
  }
  create = async (data: CreateLocationDto): Promise<Location> => {
    return this.locationRepo.save(data);
  };
}
