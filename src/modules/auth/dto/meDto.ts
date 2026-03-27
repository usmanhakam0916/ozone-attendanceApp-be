import { IsInt, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MeQueryDto {
    @ApiProperty({ description: 'Month (1-12)', example: 12, required: false })
    @IsInt()
    @IsOptional()
    month?: number;

    @ApiProperty({ description: 'Year', example: 2025, required: false })
    @IsInt()
    @IsOptional()
    year?: number;
}
