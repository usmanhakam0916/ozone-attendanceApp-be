import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { GroupPolicy } from './group_policies.entity';

@Injectable()
export class GroupPolicyService {
  constructor(
    @InjectRepository(GroupPolicy)
    private readonly groupPolicyRepo: Repository<GroupPolicy>,
  ) { }

  async findById(id: number): Promise<GroupPolicy> {
    return this.groupPolicyRepo.findOne(id, {
      relations: ['employees'],
    });
  }
}
