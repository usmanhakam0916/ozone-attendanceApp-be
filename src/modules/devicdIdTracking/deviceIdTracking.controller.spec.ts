import { Test, TestingModule } from '@nestjs/testing';
import { DeviceIdTrackingController } from './deviceIdTracking.controller';
import { DeviceIdTrackingService } from './deviceIdTracking.service';

describe('DepartmentsController', () => {
  let controller: DeviceIdTrackingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DeviceIdTrackingController],
      providers: [DeviceIdTrackingService],
    }).compile();

    controller = module.get<DeviceIdTrackingController>(DeviceIdTrackingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
