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

  create(createDepartmentDto: CreateDepartmentDto) {
    return 'This action adds a new department';
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

  findOne(id: number) {
    return `This action returns a #${id} department`;
  }

  update(id: number, updateDepartmentDto: UpdateDepartmentDto) {
    return `This action updates a #${id} department`;
  }

  remove(id: number) {
    return `This action removes a #${id} department`;
  }
}
