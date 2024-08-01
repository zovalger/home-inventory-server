import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from './dto/create-user.dto';
import { User } from './entities/user.entity';
import { EmailService } from 'src/email/email.service';
import { UserVerificationCode } from './entities';
import { CreateUserVerificationCodeDto } from './dto/create-user-verification-code.dto';
import { LoginUserDto } from './dto/login-user.dto';
import { JwtService } from '@nestjs/jwt';
import { JwtPayload } from './interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserVerificationCode)
    private readonly userCodeVerificationRepository: Repository<UserVerificationCode>,
    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async create(createUserDto: CreateUserDto) {
    const { password, ...restUserData } = createUserDto;

    const userData = {
      ...restUserData,
      password: bcrypt.hashSync(password, 10),
    };

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = await queryRunner.manager.create(User, userData);

      await queryRunner.manager.save(user);

      const verificationCode = await queryRunner.manager.create(
        UserVerificationCode,
        this.generateVerificationCodeObject(user),
      );

      await queryRunner.manager.save(verificationCode);

      await this.emailService.sendEmail_CreateUser({
        user,
        verificationCode,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      delete user.password;

      return {
        message: 'User registered successfully',
        data: user,
        token: this.getJwtToken({ id: user.id }),
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    if (!user) throw new NotFoundException('User or password incorrect');

    if (!bcrypt.compareSync(password, user.password))
      throw new NotFoundException('User or password incorrect');

    return { token: this.getJwtToken({ id: user.id }) };
  }

  private generateVerificationCodeObject(
    user: User,
  ): CreateUserVerificationCodeDto {
    const expireIn = new Date(Date.now() + 1800000).toISOString();

    const code = [];

    for (let index = 0; index < 4; index++) {
      const num = Math.round(Math.random() * 9);

      code.push(num);
    }

    return {
      user,
      code: code.join(''),
      expireIn,
    };
  }

  private getJwtToken(jwtPayload: JwtPayload) {
    const token = this.jwtService.sign(jwtPayload);

    return token;
  }

  handleDBError(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('The user is already register');

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
