import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Request,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { DeleteResult, getRepository, Repository } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { GroupPolicy } from './group_policies.entity';
import { createPolicyGroupDTO } from './dto/createPlicyGroupDTO';
import { EmployeeService } from '../employee/employee.service';
import { GroupPolicyService } from './groupPolicy.service';
import { UserType } from '../user/user.entity';
import { updateGroupPolicyDTO } from './dto/updateGroupPolicyDTO';
@ApiBearerAuth()
@Controller('groupPolicies')
@ApiTags('GroupPolicies')
export class GroupPoliciesController {
  constructor(
    private readonly employeesService: EmployeeService,
    private readonly groupPolicyService: GroupPolicyService,
    @InjectRepository(GroupPolicy)
    private readonly groupPoliciesRepo: Repository<GroupPolicy>,
  ) { }

  @ApiOperation({ summary: 'Get all GroupPolicies' })
  @ApiResponse({ type: GroupPolicy, status: 200 })
  @Get()
  public async getAllGroupPolicies() {
    let response = await getRepository(GroupPolicy)
      .createQueryBuilder('groupPolicy')
      .leftJoin('groupPolicy.owner', 'owner')
      .leftJoin('groupPolicy.employees', 'employees')
      .select([
        'groupPolicy.id',
        'groupPolicy.name',
        'groupPolicy.tags',
        'groupPolicy.checkinTime',
        'groupPolicy.checkoutTime',
        'owner.id',
        'employees.id',
      ])
      .getMany();
    // const new_response = response.map((item) => {
    //   item;
    //   item['employeeCount'] = item.employees.length;
    //   delete item.employees;
    // });
    return response;
  }

  @ApiOperation({ summary: ' create a new policy group' })
  @ApiResponse({ type: GroupPolicy, status: 200 })
  @UsePipes(ValidationPipe)
  @Post()
  public async createGroupPolicy(
    @Body() data: createPolicyGroupDTO,
    @Request() req,
  ) {
    const policy = new GroupPolicy();
    policy.name = data.name;
    policy.checkinTime = data.checkinTime;
    policy.checkoutTime = data.checkoutTime;
    policy.tags = data.tags;
    policy.owner = req.user;
    if (data.employees && data.employees.length > 0) {
      const employees = await this.employeesService.findMultipleById(
        data.employees,
      );
      policy.employees = employees;
    }
    const inserted = await this.groupPoliciesRepo.save(policy);
    const new_policy = await this.groupPoliciesRepo.findOne(inserted.id, {
      relations: ['employees'],
    });
    return new_policy;
  }

  @ApiOperation({ summary: 'Get Policy By Id' })
  @ApiResponse({ type: GroupPolicy, status: 200 })
  @UsePipes(ValidationPipe)
  @Get('/:id')
  public async show(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const policy = await this.groupPoliciesRepo.findOne(
      { id: id },
      { relations: ['employees', 'employees.authUser'] },
    );
    if (!policy) {
      throw new HttpException(
        `GroupPolicy does not exist against this id: ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    return policy;
  }

  @ApiOperation({ summary: 'update group policy' })
  @ApiResponse({ type: GroupPolicy, status: 200 })
  @Patch(':id')
  @UsePipes(ValidationPipe)
  @Post()
  public async updateGrouPolicy(
    @Body() data: updateGroupPolicyDTO,
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
  ) {
    const policy = await this.groupPolicyService.findById(id);
    policy.name = data.name;
    policy.checkinTime = data.checkinTime;
    policy.checkoutTime = data.checkoutTime;
    policy.tags = data.tags;
    if (
      (data.employees && data.employees.length > 0) ||
      policy.employees.length > 0
    ) {
      if (data.employees.length == 0) {
        policy.employees = [];
      } else {
        const employees = await this.employeesService.findMultipleById(
          data.employees,
        );
        policy.employees = employees;
      }
    }
    await this.groupPoliciesRepo.save(policy);
    const new_policy = this.groupPoliciesRepo.findOne(id, {
      relations: ['employees', 'employees.authUser'],
    });
    return new_policy;
  }

  @ApiOperation({ summary: 'Delete groupPolicy, only admin can do it' })
  @ApiResponse({ type: GroupPolicy, status: 200 })
  @Delete(':id')
  public async remove(
    @Param(
      'id',
      new ParseIntPipe({ errorHttpStatusCode: HttpStatus.NOT_ACCEPTABLE }),
    )
    id: number,
    @Request() req,
  ): Promise<DeleteResult> {
    if (req.user.type !== UserType.ADMIN) {
      throw new HttpException(
        `Only admin can use this api`,
        HttpStatus.UNAUTHORIZED,
      );
    }
    const groupPolicy = await this.groupPolicyService.findById(id);

    if (!groupPolicy) {
      throw new HttpException(
        `GroupPolicy does not exist against this id: ${id}`,
        HttpStatus.NOT_FOUND,
      );
    }
    delete groupPolicy.employees;
    return this.groupPoliciesRepo.delete(groupPolicy);
  }
}
