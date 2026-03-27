import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VersionManageController } from './version_manager.controller';
import { VersionManager } from './version_manager.entity';
import { VersionManagerService } from './version_manager.service';

@Module({
  imports: [TypeOrmModule.forFeature([VersionManager])],
  controllers: [VersionManageController],
  providers: [VersionManagerService],
})
export class VersionManagerModule { }
