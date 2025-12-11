import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

import docs from './version_manager.docs';

@Entity()
export class VersionManager {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.iosVersion)
  @Column()
  @IsNotEmpty()
  @IsString()
  iosVersion: string;

  @ApiProperty(docs.androidVersion)
  @Column()
  @IsNotEmpty()
  @IsString()
  androidVersion: string;

  @ApiProperty(docs.isActive)
  @Column({ default: false })
  @IsBoolean()
  isActive: boolean;

  @ApiProperty(docs.createdAt)
  @Column({ default: new Date() })
  createdAt: Date;
}
