import { Test, TestingModule } from '@nestjs/testing';
import { CompanyLocationsController } from './company-locations.controller';
import { CompanyLocationsService } from './company-locations.service';

describe('CompanyLocationsController', () => {
  let controller: CompanyLocationsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CompanyLocationsController],
      providers: [CompanyLocationsService],
    }).compile();

    controller = module.get<CompanyLocationsController>(
      CompanyLocationsController,
    );
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
