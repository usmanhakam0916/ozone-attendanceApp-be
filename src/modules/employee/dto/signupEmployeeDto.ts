import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsNotEmpty, IsNumber, IsOptional, IsString, MinLength } from 'class-validator';
import docs from '../employee.docs';

export class SignupEmployeeDto {
    @ApiProperty(docs.email)
    @IsEmail()
    @IsNotEmpty()
    email: string;

    @ApiProperty(docs.firstName)
    @IsOptional()
    @IsString()
    firstName?: string;

    @ApiProperty(docs.lastName)
    @IsOptional()
    @IsString()
    lastName?: string;

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

    @ApiProperty(docs.deviceId)
    @IsString()
    deviceId: string;
}
