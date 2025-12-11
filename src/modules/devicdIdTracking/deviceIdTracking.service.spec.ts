import { Test, TestingModule } from '@nestjs/testing';
import { DeviceIdTrackingService } from './deviceIdTracking.service';

describe('DepartmentsService', () => {
  let service: DeviceIdTrackingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DeviceIdTrackingService],
    }).compile();

    service = module.get<DeviceIdTrackingService>(DeviceIdTrackingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
