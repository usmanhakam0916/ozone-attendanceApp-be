import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from '../employee/employee.entity';

import docs from './attendance.docs';
import locationDocs from '../location/location.docs';
import { Location } from '../location/location.entity';
import { User } from '../user/user.entity';


export enum UpdateRequestStatus {
  NONE = '',
  CHECKIN_REQUESTED = 'CHECKIN_REQUESTED',
  CHECKOUT_REQUESTED = 'CHECKOUT_REQUESTED'
}

@Entity()
export class Attendance {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.checkInTime)
  @Column()
  @IsString()
  @IsNotEmpty()
  checkInTime: string;

  @ApiProperty(docs.checkoutTime)
  @Column({ default: '' })
  @IsString()
  @IsOptional()
  checkoutTime?: string;

  @ApiProperty(docs.locationId)
  @Column({ default: 0 })
  @IsNumber()
  @IsNotEmpty()
  locationId: number;

  @ApiProperty(docs.isArchived)
  @Column({ default: false })
  @IsBoolean()
  isArchived: boolean;

  @ApiProperty(docs.checkInId)
  @Column({ default: '' })
  @IsString()
  @IsOptional()
  checkInId?: string;

  @ApiProperty(docs.deviceId)
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  checkinDeviceId?: string;

  @ApiProperty(docs.deviceId)
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  checkoutDeviceId?: string;

  @ApiProperty(docs.checkoutLocationId)
  @Column({ default: null })
  @IsNumber()
  @IsOptional()
  checkoutLocationId: number;

  @ApiProperty(locationDocs.qrCode)
  @Column({ default: '' })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiProperty(docs.isNightShiftLogin)
  @Column({ default: false })
  @IsBoolean()
  isNightShiftLogin: boolean;

  @ApiProperty(docs.checkInType)
  @Column({ default: null })
  @IsString()
  checkInType: string;

  @ApiProperty(docs.checkOutType)
  @Column({ default: null })
  @IsString()
  checkOutType: string;

  @ApiProperty(docs.checkInFace)
  @Column({ default: null })
  @IsString()
  checkInFace: string;

  @ApiProperty(docs.checkOutFace)
  @Column({ default: null })
  @IsString()
  checkOutFace: string;

  @Column({ default: null })
  syncedAt: Date;

  @Column({ type: 'json', nullable: true })
  updateRequestData?: Record<string, any>;

  @ApiProperty(docs.updateRequestStatus)
  @IsString()
  @IsNotEmpty()
  @Column({ type: 'enum', enum: UpdateRequestStatus, default: UpdateRequestStatus.NONE })
  updateRequestStatus: UpdateRequestStatus;

  @ManyToOne(() => Employee, (employee) => employee.attendances)
  public employee: Employee;

  @ManyToOne(() => User, (user) => user.attendances)
  public syncByUser: User;

  @ManyToOne(() => Location, (location) => location.attendances, {
    eager: true,
  })
  public location: Location;

  @ManyToOne(() => Location, (location) => location.checkoutAttendances, {
    eager: true,
  })
  public checkoutLocation: Location;
}