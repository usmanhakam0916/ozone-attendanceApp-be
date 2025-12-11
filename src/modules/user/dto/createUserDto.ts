import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import docs from '../user.docs';

import { UserType } from '../user.entity';

export class CreateUserDto {
  type: UserType;

  @ApiProperty(docs.username)
  // @IsString()
  @IsNotEmpty()
  username: string;
}

export class CreateHouseKeepingDto {
  @ApiProperty(docs.Name)
  @IsString()
  @IsNotEmpty()
  Name: string;

  @ApiProperty(docs.Id)
  @IsString()
  @IsNotEmpty()
  Id: string;

  @ApiProperty(docs.Branch)
  @IsString()
  @IsNotEmpty()
  Branch: string;

  @ApiProperty(docs.Company)
  @IsString()
  @IsNotEmpty()
  Company: string;
}

export class CreateAdminUserDto {
  type: UserType;

  @ApiProperty(docs.username)
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty(docs.password)
  @IsString()
  @IsOptional()
  password?: string;

  @IsOptional()
  profileId: number;
}
