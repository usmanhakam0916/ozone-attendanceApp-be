import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import { CreateEmployeeDto } from './createEmployeeDto';
import { Exclude } from 'class-transformer';
import docs from '../employee.docs';

export class SignupEmployeeDto {
    @ApiProperty(docs.attendanceType)
    @IsOptional()
    @IsString()
    employeeName?: string;

    @ApiProperty(docs.userName)
    @IsString()
    @IsNotEmpty()
    userName: string;

    @ApiProperty(docs.groupId)
    @IsNumber()
    @IsOptional()
    groupId?: number;

    @ApiProperty(docs.isMac)
    @IsOptional()
    @IsBoolean()
    isMac?: boolean;

    @ApiProperty(docs.macAddress)
    @IsOptional()
    @IsString()
    macAddress?: string;

    @ApiProperty(docs.locations)
    locations?: number[];


    @ApiProperty()
    @IsNumber()
    @IsOptional()
    departmentId?: number;

    @ApiProperty({ example: 'password123', description: 'User password' })
    @IsString()
    @IsNotEmpty()
    @MinLength(6)
    password: string;
}
