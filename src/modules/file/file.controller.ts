import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  Body,
  Delete,
  Param,
  Request,
  ParseIntPipe,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { File } from './file.entity';
import { FileService } from './file.service';
import { DeleteResult } from 'typeorm';

@Controller('files')
@ApiTags('File')
@ApiBearerAuth()
export class FileController {
  constructor(private fileService: FileService) { }

  @ApiOperation({ summary: 'Upload file' })
  @ApiResponse({ type: File, status: 201 })
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async addAvatar(@Request() req, @UploadedFile() file, @Body() data) {
    const employeeId = data.employeeId;
    const user = req.user;
    return this.fileService.uploadFile(file, user, employeeId);
  }

  @ApiOperation({ summary: 'Delete customer' })
  @ApiResponse({ type: File, status: 200 })
  @Delete('remove/:id')
  public async deleteFile(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ): Promise<DeleteResult> {
    return this.fileService.deletePublicFile(id);
  }
}
