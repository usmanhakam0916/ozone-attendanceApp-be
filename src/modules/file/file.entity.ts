import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class File {
  @PrimaryGeneratedColumn()
  public id: number;

  @ApiProperty({
    required: true,
    example: 'url',
    description: 'This is the url of file',
  })
  @Column()
  @IsString()
  @IsNotEmpty()
  public url: string;

  @ApiProperty({
    required: true,
    example: 'key',
    description: 'This is the key of file',
  })
  @Column()
  public key: string;

  @ApiProperty({
    required: true,
    example: 'name',
    description: 'This is the name of file',
  })
  @Column()
  public name: string;
}
