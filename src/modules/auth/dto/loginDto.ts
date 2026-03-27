import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    required: true,
    example: 'admin@email.com',
    description: 'Unique email of a user.',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    required: true,
    example: 'admin',
    description: 'Unique username of a user.',
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    required: true,
    example: '1245',
  })
  @IsString()
  @IsOptional()
  deviceId: string;

  @ApiProperty({
    required: false,
    example: 'android || iphone',
  })
  @IsString()
  @IsOptional()
  deviceType: string;

  @ApiProperty({
    required: true,
    example: '1.2.3',
  })
  @IsOptional()
  version: string;

  @ApiProperty({
    required: true,
    example: '1.2.3',
  })
  @IsOptional()
  osVersion: string | number;
}

export class ChangePasswordDto {
  @ApiProperty({
    required: true,
    example: '123',
    description: 'Old/Current password',
  })
  @IsString()
  @IsNotEmpty()
  oldPassword: string;

  @ApiProperty({
    required: true,
    example: 'xyz',
    description: 'New password',
  })
  @IsString()
  @IsNotEmpty()
  newPassword: string;
}
