import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User } from './entities/user.entity';
import { UserVerificationCodeService } from './providers';
import { UserVerificationCode } from './entities/user-verification-code.entity';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserVerificationCode]),
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, UserVerificationCodeService],
  exports: [TypeOrmModule],
})
export class AuthModule {}
