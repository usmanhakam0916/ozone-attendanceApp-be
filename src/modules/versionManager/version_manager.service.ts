import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { VersionManager } from './version_manager.entity';

@Injectable()
export class VersionManagerService {
  constructor(
    @InjectRepository(VersionManager)
    private readonly versionManagerRepo: Repository<VersionManager>,
  ) { }

  async findById(id: number): Promise<VersionManager> {
    return this.versionManagerRepo.findOne(id);
  }

  async findActiveVersion(): Promise<VersionManager> {
    return await this.versionManagerRepo.findOne({ isActive: true });
  }
}
