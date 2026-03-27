import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Admin } from '../admin/admin.entity';
import { Attendance } from '../attendance/attendance.entity';
import docs from './location.docs';

@Entity()
export class Location {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.name)
  @Column({ unique: true })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty(docs.qrCode)
  @Column({ default: '' })
  @IsNotEmpty()
  @IsString()
  qrCode: string;

  @ApiProperty(docs.lat)
  @Column('decimal', { default: 0 })
  @IsNotEmpty()
  @IsNumber()
  lat: number;

  @ApiProperty(docs.lat)
  @Column('decimal', { default: 0 })
  @IsNotEmpty()
  @IsNumber()
  long: number;

  @ManyToOne(() => Admin, (admin) => admin.locations, {
    // eager: true,
    onDelete: 'SET NULL',
  })
  public admin: Admin;

  @OneToMany(() => Attendance, (attendances) => attendances.location)
  attendances: Attendance[];

  @OneToMany(() => Attendance, (attendances) => attendances.checkoutLocation)
  checkoutAttendances: Attendance[];
}
