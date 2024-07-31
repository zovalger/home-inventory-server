import { Test, TestingModule } from '@nestjs/testing';
import { UserVerificationCodeService } from './user-verification-code.service';

describe('UserVerificationCodeService', () => {
  let service: UserVerificationCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserVerificationCodeService],
    }).compile();

    service = module.get<UserVerificationCodeService>(UserVerificationCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
