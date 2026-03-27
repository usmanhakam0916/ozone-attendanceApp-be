import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';

import { Coupons } from './coupons.entity';
import { UpdateCouponDto } from './dto/updateCouponDto';

@ApiBearerAuth()
@Controller('coupons')
@ApiTags('Coupons')
export class CouponsController {
  constructor(
    @InjectRepository(Coupons)
    private readonly couponsRepo: Repository<Coupons>,
  ) { }

  @ApiOperation({ summary: 'update coupon' })
  @ApiResponse({ type: Coupons, status: 200 })
  @Post()
  public async getCoupon(@Body() data: UpdateCouponDto) {
    const coupon = await this.couponsRepo.findOne({ used: false });
    if (!coupon) {
      throw new HttpException(
        `coupon with false used value does not exist`,
        HttpStatus.NOT_FOUND,
      );
    }
    coupon.used = true;
    coupon.employeeNumber = data.employeeNumber;
    return await this.couponsRepo.save(coupon);
  }
}
