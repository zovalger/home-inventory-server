import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './strategy/jwt.strategy';

import { EmailModule } from '../email/email.module';

import { User, UserVerificationCode } from './entities';

import { FilesModule } from '../files/files.module';
import { CommonModule } from '../common/common.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { VerificationCodeService } from './verification-code/verification-code.service';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),

    TypeOrmModule.forFeature([User, UserVerificationCode]),

    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return {
          secret: configService.get('JWT_SECRET'),
          signOptions: { expiresIn: configService.get('JWT_EXPIRE_TIME') },
        };
      },
    }),

    forwardRef(() => FilesModule),
    CommonModule,

    EmailModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService, VerificationCodeService],
  exports: [TypeOrmModule, JwtStrategy, PassportModule, JwtModule],
})
export class AuthModule {}
