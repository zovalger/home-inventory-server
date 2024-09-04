import { Test, TestingModule } from '@nestjs/testing';
import { CompanyLocationsService } from './company-locations.service';

describe('CompanyLocationsService', () => {
  let service: CompanyLocationsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CompanyLocationsService],
    }).compile();

    service = module.get<CompanyLocationsService>(CompanyLocationsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
