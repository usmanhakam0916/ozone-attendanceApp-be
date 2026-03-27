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
  PrimaryGeneratedColumn,
} from 'typeorm';
import docs from './coupons.docs';

@Entity()
export class Coupons {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.coupon)
  @Column({ default: 'agh' })
  @IsNotEmpty()
  @IsString()
  coupon: string;

  @ApiProperty(docs.link)
  @Column({ default: '' })
  @IsNotEmpty()
  @IsString()
  link: string;

  @ApiProperty(docs.employeeNumber)
  @Column({ default: null })
  @IsOptional()
  @IsNumber()
  employeeNumber: number;

  @ApiProperty(docs.used)
  @Column({ default: false })
  @IsNotEmpty()
  @IsBoolean()
  used: boolean;
}
