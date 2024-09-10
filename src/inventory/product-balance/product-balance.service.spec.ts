import { Test, TestingModule } from '@nestjs/testing';
import { ProductBalanceService } from './product-balance.service';

describe('ProductBalanceService', () => {
  let service: ProductBalanceService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ProductBalanceService],
    }).compile();

    service = module.get<ProductBalanceService>(ProductBalanceService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
