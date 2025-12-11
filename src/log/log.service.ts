import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AppHelpers } from 'src/helpers/app.helpers';
import { Repository } from 'typeorm';
import { Log } from './log.entity';
@Injectable()
export class LogService {
  constructor(
    @InjectRepository(Log)
    private readonly logsRepo: Repository<Log>,
  ) { }

  async createLog(log) {
    await this.logsRepo.save({
      ...log,
      createdAt: AppHelpers.getCurrentDateTime(),
    });
  }
}
