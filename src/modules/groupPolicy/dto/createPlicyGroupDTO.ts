import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import docs from '../group_policies.docs';

export class createPolicyGroupDTO {
  @ApiProperty(docs.name)
  @IsNotEmpty()
  @IsString()
  name: string;

  @ApiProperty(docs.checkinTime)
  @IsNotEmpty()
  @IsString()
  checkinTime: string;

  @ApiProperty(docs.checkoutTime)
  @IsNotEmpty()
  @IsString()
  checkoutTime: string;

  @ApiProperty(docs.employees)
  @IsOptional()
  employees: number[];

  @ApiProperty(docs.tags)
  @IsOptional()
  @IsString()
  tags: string;
}
