import { Repository } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';

import { Admin } from './admin.entity';
import { User, UserStatus } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { FileService } from '../file/file.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Admin)
    private readonly adminRepo: Repository<Admin>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly userService: UserService,
    private readonly fileService: FileService,
  ) { }

  async findById(id: number): Promise<Admin> {
    return this.adminRepo.findOne(id);
  }

  async findByAuthUserId(id: number): Promise<Admin> {
    const authUser = await this.userRepo.findOne({
      id,
    });

    return this.adminRepo.findOne({ authUser });
  }

  create = async (data): Promise<Admin> => {
    data.authUser.status = UserStatus.ACTIVE;

    let avatar = null;
    if (data.avatar) {
      avatar = await this.fileService.findById(data.avatar);
    }

    const authUser = await this.userService.create({
      ...data.authUser,
      username: data.authUser.username.toLowerCase(),
    });

    const admin = await this.adminRepo.save({
      avatar,
      authUser,
    });
    authUser.profileId = admin.id;
    await this.userRepo.save(authUser);
    return admin;
  };
}
