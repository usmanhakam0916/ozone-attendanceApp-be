import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Attendance } from '../attendance/attendance.entity';
import { Department } from '../departments/entities/department.entity';
import { File } from '../file/file.entity';
import { GroupPolicy } from '../groupPolicy/group_policies.entity';
import { Location } from '../location/location.entity';

import { User } from '../user/user.entity';
import docs from './employee.docs';
import { Language } from './dto/patchEmployeeDto';

export enum AttendanceType {
  SINGLE = 'Single',
  DOUBLE = 'Double',
  MULTIPLE = 'Multiple',
}

@Entity()
export class Employee {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.attendanceType)
  @Column('enum', { enum: AttendanceType, default: AttendanceType.SINGLE })
  @IsString()
  @IsNotEmpty()
  attendanceType: AttendanceType;

  @ApiProperty(docs.checkInRowId)
  @Column({ default: '' })
  @IsString()
  @IsOptional()
  checkInRowId?: string;

  @ApiProperty(docs.attendanceRadius)
  @Column({ default: 100 })
  @IsNumber()
  @IsNotEmpty()
  attendanceRadius: number;

  @ApiProperty(docs.macAddress)
  @Column({ default: null })
  @IsNotEmpty()
  macAddress: string;

  @ApiProperty(docs.isMac)
  @Column({ default: false })
  @IsNotEmpty()
  isMac: boolean;

  @ApiProperty(docs.isMac)
  @Column({ nullable: true })
  avatarId: number;

  @OneToOne(() => User, {
    eager: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  @JoinColumn()
  authUser: User;

  @Column()
  authUserId: number;

  @OneToOne(() => File, { eager: true })
  @JoinColumn()
  avatar: File;

  @OneToMany(() => Attendance, (attendances) => attendances.employee, {
    eager: true,
  })
  attendances: Attendance[];

  @ManyToMany(() => Location, { eager: true })
  @JoinTable()
  locations: Location[];

  @ManyToOne(() => GroupPolicy, (group) => group.employees, {
    eager: true,
    onDelete: 'SET NULL',
  })
  public group: GroupPolicy;

  @ManyToOne(() => Department, (department) => department.employee, {
    lazy: true,
    onDelete: 'SET NULL',
  })
  department: Department;


  @Column({
    type: 'enum',
    enum: Language,
    default: Language.EN,
  })
  @IsOptional()
  language: Language;
}
