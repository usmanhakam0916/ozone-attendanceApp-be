import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import docs from '../../employee/employee.docs';

export class ForgetPasswordDto {
    @ApiProperty(docs.email)
    @IsNotEmpty()
    @IsString()
    email: string;
}
