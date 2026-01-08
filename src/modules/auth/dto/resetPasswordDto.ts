import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import docs from '../../employee/employee.docs';

export class ResetPasswordDto {
    @ApiProperty(docs.email)
    @IsNotEmpty()
    @IsString()
    email: string;

    @ApiProperty(docs.otp)
    @IsNotEmpty()
    @IsString()
    otp: string;

    @ApiProperty(docs.password)
    @IsString()
    @IsOptional()
    password?: string;
}
