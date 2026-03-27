import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DepartmentsService } from './departments.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@ApiBearerAuth()
@ApiTags('Departments')
@Controller('departments')
export class DepartmentsController {
  constructor(private readonly departmentsService: DepartmentsService) { }

  @Post()
  @ApiOperation({ summary: 'Create department' })
  @ApiResponse({ status: 200 })
  async create(@Body() createDepartmentDto: CreateDepartmentDto) {
    return await this.departmentsService.create(createDepartmentDto);
  }

  @Get('search/:departmentName')
  @ApiOperation({ summary: 'Search department' })
  @ApiResponse({ status: 200 })
  async search(@Param('departmentName') departmentName: string) {
    return await this.departmentsService.search(departmentName);
  }

  @Get()
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200 })
  async findAll() {
    return await this.departmentsService.findAll();
  }

  @Get(':take/:skip')
  @ApiOperation({ summary: 'Get all departments' })
  @ApiResponse({ status: 200 })
  async findPaginatedData(@Param('take') take: number, @Param('skip') skip: number) {
    return await this.departmentsService.findPaginatedData(take, skip);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get department by id' })
  @ApiResponse({ status: 200 })
  async findOne(@Param('id') id: string) {
    return await this.departmentsService.findOne(+id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update department by id' })
  @ApiResponse({ status: 201 })
  async update(
    @Param('id') id: string,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ) {
    return await this.departmentsService.update(+id, updateDepartmentDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete department by id' })
  @ApiResponse({ status: 201 })
  async remove(@Param('id') id: string) {
    return await this.departmentsService.remove(+id);
  }
}
