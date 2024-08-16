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

import { AuthService } from './auth.service';
import { CreateUserPipe, EmailFormatEmailPipe, UpdateUserPipe } from './pipes';
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body(CreateUserPipe) createAuthDto: CreateUserDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Body(EmailFormatEmailPipe) loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('profile')
  @Auth({ withoutVerification: true, withoutFamilyMember: true })
  profile(@GetUser() user: User) {
    return this.authService.profile(user);
  }

  @Post('verify')
  @Auth({ withoutVerification: true, withoutFamilyMember: true })
  @HttpCode(HttpStatus.OK)
  verify(
    @GetUser() user: User,
    @Body() verificationCodeDto: VerificationCodeDto,
  ) {
    return this.authService.verify(user, verificationCodeDto);
  }

  @Post('resend_code')
  @HttpCode(HttpStatus.OK)
  @Auth({ withoutVerification: true, withoutFamilyMember: true })
  resendVerificationCode(@GetUser() user: User) {
    return this.authService.resendVerificationCode(user);
  }

  @Patch('edit')
  @Auth({ withoutFamilyMember: true })
  editUser(
    @GetUser() user: User,
    @Body(UpdateUserPipe) updateUserDto: UpdateUserDto,
  ) {
    return this.authService.updateUser(user, updateUserDto);
  }

  // @Patch('edit/email')
  // @Auth({ withoutFamilyMember: true })
  // editUserEmail(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
  //   return this.authService.updateUser(user, updateUserDto);
  // }
}
