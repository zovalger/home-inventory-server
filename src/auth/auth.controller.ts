import { Controller, Post, Body, Get, Patch } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FormatEmailPipe } from './pipes/format-email/format-email.pipe';
import { Auth } from './decorators/auth.decorator';
import { GetUser } from './decorators/get-user.decorator';
import { User } from './entities';
import { VerificationCodeDto } from './dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  create(@Body(FormatEmailPipe) createAuthDto: CreateUserDto) {
    return this.authService.create(createAuthDto);
  }

  @Post('login')
  login(@Body(FormatEmailPipe) loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto);
  }

  @Get('profile')
  @Auth({ withoutVerification: true })
  profile(@GetUser() user: User) {
    return this.authService.profile(user);
  }

  @Post('resend_code')
  @Auth({ withoutVerification: true })
  resendVerificationCode(@GetUser() user: User) {
    return this.authService.resendVerificationCode(user);
  }

  @Post('verify')
  @Auth({ withoutVerification: true })
  verify(
    @GetUser() user: User,
    @Body() verificationCodeDto: VerificationCodeDto,
  ) {
    return this.authService.verify(user, verificationCodeDto);
  }

  @Patch('edit')
  @Auth()
  editUser(@GetUser() user: User, @Body() updateUserDto: UpdateUserDto) {
    return this.authService.updateUser(user, updateUserDto);
  }
}
