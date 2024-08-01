import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { FormatEmailPipe } from './pipes/format-email/format-email.pipe';

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

  // todo: ruta para verificar usuario
}
