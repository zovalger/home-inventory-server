import { Test, TestingModule } from '@nestjs/testing';
import { EmailSender } from './email-sender';

describe('EmailSenderService', () => {
  let service: EmailSender;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmailSender],
    }).compile();

    service = module.get<EmailSender>(EmailSender);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
