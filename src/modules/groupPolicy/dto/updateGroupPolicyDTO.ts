import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import docs from '../group_policies.docs';

export class updateGroupPolicyDTO {
  @ApiProperty(docs.name)
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name: string;

  @ApiProperty(docs.checkinTime)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  checkinTime: string;

  @ApiProperty(docs.checkoutTime)
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  checkoutTime: string;

  @ApiProperty(docs.tags)
  @IsOptional()
  @IsString()
  tags: string;

  @ApiProperty(docs.employees)
  @IsOptional()
  employees: number[];
}
