import { BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateUserVerificationCodeDto } from '../dto';

import {
  ErrorHandleProvider,
  ResMessages,
  ResponseBodyFormat,
} from '../../common/providers';
import { UserVerificationCode } from '../entities';

export class VerificationCodeService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly responseBodyFormat: ResponseBodyFormat,

    @InjectRepository(UserVerificationCode)
    private readonly userCodeVerificationRepository: Repository<UserVerificationCode>,
  ) {}

  create(userId: string): UserVerificationCode {
    const obj = this.generateCode(userId);

    return this.userCodeVerificationRepository.create(obj);
  }

  async getValidCode(
    userId: string,
    code: string,
  ): Promise<UserVerificationCode> {
    const verifyCode = await this.userCodeVerificationRepository.findOneBy({
      userId,
      code,
    });

    if (!verifyCode)
      throw new NotFoundException(this.resMessages.userVerifyCodeNotFound);

    const expireDate = new Date(verifyCode.expireIn).getTime();

    if (Date.now() > expireDate)
      throw new BadRequestException(this.resMessages.userVerifyCodeExpired);

    return verifyCode;
  }

  generateCode(userId: string): CreateUserVerificationCodeDto {
    const expireIn = new Date(Date.now() + 1800000).toISOString();

    const code = [];

    for (let index = 0; index < 4; index++) {
      const num = Math.round(Math.random() * 9);

      code.push(num);
    }

    return {
      userId,
      code: code.join(''),
      expireIn,
    };
  }
}
