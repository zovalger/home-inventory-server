import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';

import { User } from './entities';

import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { VerificationCodeDto } from './dto';
import { UpdateUserDto } from './dto/update-user.dto';

import {
  ErrorHandleProvider,
  ResMessages,
  ResponseBodyFormat,
} from '../common/providers';

import { AuthService } from './auth.service';
import { CreateUserPipe, EmailFormatEmailPipe, UpdateUserPipe } from './pipes';
@Controller('auth')
export class AuthController {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly responseBodyFormat: ResponseBodyFormat,
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async create(@Body(CreateUserPipe) createAuthDto: CreateUserDto) {
    const { token, user } = await this.authService.create(createAuthDto);

    return this.responseBodyFormat.withToken(
      token,
      this.resMessages.userRegisterSuccess,
      user,
    );
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body(EmailFormatEmailPipe) loginUserDto: LoginUserDto) {
    const token = await this.authService.login(loginUserDto);

    return this.responseBodyFormat.withToken(
      token,
      this.resMessages.userLoginSuccess,
    );
  }

  @Get('profile')
  @Auth({ withoutVerification: true, withoutFamilyMember: true })
  async profile(@GetUser() user: User) {
    const data = await this.authService.profile(user);

    return this.responseBodyFormat.basic(
      this.resMessages.userProfileObtained,
      data,
    );
  }

  @Post('verify')
  @Auth({ withoutVerification: true, withoutFamilyMember: true })
  @HttpCode(HttpStatus.OK)
  async verify(
    @GetUser() user: User,
    @Body() verificationCodeDto: VerificationCodeDto,
  ) {
    await this.authService.verify(user, verificationCodeDto);

    return this.responseBodyFormat.basic(this.resMessages.userVerifySuccess);
  }

  @Post('resend_code')
  @HttpCode(HttpStatus.OK)
  @Auth({ withoutVerification: true, withoutFamilyMember: true })
  async resendVerificationCode(@GetUser() user: User) {
    await this.authService.resendVerificationCode(user);

    return this.responseBodyFormat.basic(
      this.resMessages.verifyCodeResend(user.email),
    );
  }

  @Patch('edit')
  @Auth({ withoutFamilyMember: true })
  async editUser(
    @GetUser() user: User,
    @Body(UpdateUserPipe) updateUserDto: UpdateUserDto,
  ) {
    const userUpdated = await this.authService.updateUser(user, updateUserDto);

    return this.responseBodyFormat.basic(
      this.resMessages.userAlreadyRegisted,
      userUpdated,
    );
  }

  // @Patch('edit/email')
  // @Auth({ withoutFamilyMember: true })
  // editUserEmail(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
  //   return this.authService.updateUser(user, updateUserDto);
  // }
}
