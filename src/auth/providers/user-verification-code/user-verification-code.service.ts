import { Injectable } from '@nestjs/common';

import { User, UserVerificationCode } from 'src/auth/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class UserVerificationCodeService {
  constructor(
    @InjectRepository(UserVerificationCode)
    private readonly userCodeVerificationRepository: Repository<UserVerificationCode>,
  ) {}

  async create(user: User): Promise<UserVerificationCode> {
    const code = this.generateCode();
    const expireIn = new Date(Date.now() + 1800000).toISOString();

    const verificationCode = this.userCodeVerificationRepository.create({
      user,
      code,
      expireIn,
    });

    await this.userCodeVerificationRepository.save(verificationCode);

    return verificationCode;
  }

  private generateCode(): string {
    const code = [];

    for (let index = 0; index < 4; index++) {
      const num = Math.round(Math.random() * 9);

      code.push(num);
    }

    return code.join('');
  }
}
