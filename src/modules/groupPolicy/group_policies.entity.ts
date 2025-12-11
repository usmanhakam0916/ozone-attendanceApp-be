import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Employee } from '../employee/employee.entity';
import { User } from '../user/user.entity';
import docs from './group_policies.docs';

@Entity()
export class GroupPolicy {
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty(docs.name)
  @Column()
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty(docs.checkinTime)
  @Column()
  @IsNotEmpty()
  @IsString()
  checkinTime: string;

  @ApiProperty(docs.checkoutTime)
  @Column()
  @IsNotEmpty()
  @IsString()
  checkoutTime: string;

  @ApiProperty(docs.tags)
  @Column({ default: null })
  @IsNotEmpty()
  @IsString()
  tags: string;

  @OneToMany(() => Employee, (employee) => employee.group)
  employees: Employee[];

  @ManyToOne(() => User, (user) => user.groupPolicies, {
    eager: true,
    onDelete: 'SET NULL',
  })
  public owner: User;
}
