import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  Length,
  IsString,
  IsOptional,
  IsBoolean,
  IsEmail,
} from 'class-validator';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { GroupPolicy } from '../groupPolicy/group_policies.entity';

import docs from './user.docs';
import { DeviceIdTracking } from '../devicdIdTracking/entities/deviceIdTracking.entity';
import { Attendance } from '../attendance/attendance.entity';

export enum UserType {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  'HR-MANAGER' = 'hr-manager',
}

export enum UserStatus {
  ACTIVE = 'Active',
  HOLD = 'Hold',
  VACATION = 'Vacation',
  INACTIVE = 'InActive',
  TERMINATED = 'Terminated',
  CONTRACT = 'Contract',
  RESIGNED = 'Resigned',
}

export const validUserStatus = [
  UserStatus.ACTIVE,
  UserStatus.HOLD,
  UserStatus.VACATION,
  UserStatus.RESIGNED,
  UserStatus.TERMINATED,
];

export const userStatusArray = Object.values(UserStatus);
export const userStatusHash = {
  A: UserStatus.ACTIVE,
  C: UserStatus.CONTRACT,
  H: UserStatus.HOLD,
  I: UserStatus.INACTIVE,
  R: UserStatus.RESIGNED,
  T: UserStatus.TERMINATED,
  V: UserStatus.VACATION,
};

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.email)
  @Column({ unique: true, nullable: false })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty(docs.UserType)
  @Column('enum', { enum: UserType })
  @IsString()
  @Length(3, 256)
  @IsNotEmpty()
  type: UserType;

  @ApiProperty(docs.status)
  @Column('enum', { enum: UserStatus, default: UserStatus.INACTIVE })
  @IsString()
  @IsNotEmpty()
  status: UserStatus;

  @ApiProperty(docs.username)
  @Column({ unique: true })
  @IsString()
  @Length(3, 256)
  @IsNotEmpty()
  username: string;

  @ApiProperty(docs.deviceId)
  @Column({ default: null, unique: true })
  @IsOptional()
  deviceId: string;

  @ApiProperty(docs.deviceType)
  @Column({ default: null })
  @IsOptional()
  deviceType: string;

  @ApiProperty(docs.multiDevice)
  @Column({ default: false })
  multiDevice: boolean;

  // todo: remove password field login will be done with OTP
  @ApiProperty(docs.password)
  @Column({ default: '' })
  @IsString()
  @IsOptional()
  password?: string;

  @Column({ default: '' })
  @IsString()
  @IsOptional()
  company?: string;

  @ApiProperty(docs.initialData)
  @Column({ nullable: true })
  @IsString()
  @IsOptional()
  initialData?: string;

  @OneToMany(() => GroupPolicy, (group) => group.owner)
  groupPolicies: GroupPolicy[];

  @Column({ default: 0 })
  @IsOptional()
  profileId?: number;

  @ApiProperty(docs.qrCodeCheckInAllowed)
  @Column({ default: true })
  @IsNotEmpty()
  @IsBoolean()
  qrCodeCheckInAllowed: boolean;

  @ApiProperty(docs.faceCheckInAllowed)
  @Column({ default: true })
  @IsNotEmpty()
  @IsBoolean()
  faceCheckInAllowed: boolean;

  @Column({ default: true })
  @IsNotEmpty()
  @IsBoolean()
  isActiveDirectory: boolean;

  @OneToMany(
    () => DeviceIdTracking,
    (deviceIdTracking) => deviceIdTracking.user,
    {
      lazy: true,
      onDelete: 'SET NULL',
    },
  )
  deviceIdTracking: DeviceIdTracking[];

  @OneToMany(
    () => DeviceIdTracking,
    (deviceIdTracking) => deviceIdTracking.amendBy,
    {
      lazy: true,
      onDelete: 'SET NULL',
    },
  )
  deviceIdTrackingAmendBy: DeviceIdTracking[];

  @OneToMany(() => Attendance, (attendance) => attendance.syncByUser, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  attendances: Attendance[];
}
