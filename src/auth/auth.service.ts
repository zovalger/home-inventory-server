import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { User } from './entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { UserVerificationCodeService } from './providers';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly userVerificationCodeService: UserVerificationCodeService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...userData } = createUserDto;

    const user = this.userRepository.create({
      ...userData,
      password: bcrypt.hashSync(password, 10),
    });

    try {
      await this.userRepository.save(user);

      const verificationCode =
        await this.userVerificationCodeService.create(user);

      await this.emailService.createUser({
        user,
        verificationCode,
      });

      delete user.password;

      return user;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  findAll() {
    return `This action returns all auth`;
  }

  findOne(id: number) {
    return `This action returns a #${id} auth`;
  }

  update(id: number, updateAuthDto: UpdateAuthDto) {
    updateAuthDto;
    return `This action updates a #${id} auth`;
  }

  remove(id: number) {
    return `This action removes a #${id} auth`;
  }

  handleDBError(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('The user is already register');

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
