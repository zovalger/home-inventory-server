import { UserVerifiedGuard } from './user-verified.guard';

describe('UserVerifiedGuard', () => {
  it('should be defined', () => {
    expect(new UserVerifiedGuard()).toBeDefined();
  });
});
