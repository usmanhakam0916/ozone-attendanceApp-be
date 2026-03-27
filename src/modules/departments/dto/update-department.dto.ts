
import { CreateDepartmentDto } from './create-department.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
    @ApiProperty()
    @IsOptional()
    @IsBoolean()
    isArchive?: boolean;
}
