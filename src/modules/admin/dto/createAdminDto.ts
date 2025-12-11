import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import docs from 'src/modules/attendance/attendance.docs';
import { CreateAdminUserDto } from 'src/modules/user/dto/createUserDto';

export class CreateAdminDto {
  @ApiProperty(docs.avatarId)
  @IsNumber()
  @IsOptional()
  avatar?: number;

  @ApiProperty({ type: () => CreateAdminUserDto })
  @ValidateNested({ each: true })
  @Type(() => CreateAdminUserDto)
  authUser: CreateAdminUserDto;
}
