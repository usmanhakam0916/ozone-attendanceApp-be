import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';
import { Department } from './entities/department.entity';

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectRepository(Department)
    private readonly departmentRepo: Repository<Department>,
  ) { }

  async create(createDepartmentDto: CreateDepartmentDto) {
    return await this.departmentRepo.save({
      name: createDepartmentDto.name,
      isActive: createDepartmentDto.isActive,
      isArchive: false,
    });
  }

  async search(departmentName: string) {
    try {
      return await this.departmentRepo
        .createQueryBuilder('d')
        .where('d.name ILIKE :d', {
          d: `%${departmentName}%`,
        })
        .getMany();
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }
  async findAll() {
    try {
      return await this.departmentRepo.find();
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findPaginatedData(take: number, skip: number) {
    try {
      const [departments, totalDepartments] =
        await this.departmentRepo.findAndCount({ take, skip });
      return { departments, totalDepartments };
    } catch (error) {
      throw new HttpException(
        { message: error.message },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findOne(id: number) {
    return await this.departmentRepo.findOne({ where: { id } });
  }

  async update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    return await this.departmentRepo.update(id, updateDepartmentDto);
  }

  async remove(id: number) {
    return await this.departmentRepo.delete(id);
  }
}
