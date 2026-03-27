import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsOptional, ValidateNested } from 'class-validator';
import docs from 'src/modules/attendance/attendance.docs';
import { PatchUserDto } from 'src/modules/user/dto/patchUserDto';

export class PatchAdminDto {
  @ApiProperty(docs.avatarId)
  @IsOptional()
  @IsNumber()
  avatar?: number;

  @ApiProperty({ type: () => PatchUserDto })
  @ValidateNested({ each: true })
  @Type(() => PatchUserDto)
  authUser: PatchUserDto;
}
