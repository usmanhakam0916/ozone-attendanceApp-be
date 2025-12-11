import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsNotEmpty } from 'class-validator';
import docs from '../employee.docs';

export class PostRegisterFaceIdDto {
  @ApiProperty(docs.faceId)
  @IsNumber()
  @IsNotEmpty()
  faceId: number;
}
