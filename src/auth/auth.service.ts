import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

import { EmailService } from 'src/email/email.service';
import { UserVerificationCode, User } from './entities';
import { JwtPayload } from './interface';
import {
  CreateUserDto,
  VerificationCodeDto,
  LoginUserDto,
  CreateUserVerificationCodeDto,
} from './dto';
import { ResMessages } from 'src/config/res-messages';
import { UpdateUserDto } from './dto/update-user.dto';
import { FilesService } from 'src/files/files.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    @InjectRepository(UserVerificationCode)
    private readonly userCodeVerificationRepository: Repository<UserVerificationCode>,

    private readonly filesService: FilesService,

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
  // todo: hacer validacion al cambiar de email
  // enviar correo de confirmacion para cambiarlo

  async updateUser(user: User, updateUserDto: UpdateUserDto) {
    const { image: oldImage } = user;
    const { image, password, ...toUpdate } = updateUserDto;

    const imageFile = image
      ? await this.filesService.getImage(image)
      : undefined;

    const newData = {
      id: user.id,
      ...toUpdate,
      image: imageFile,
      password: password ? bcrypt.hashSync(password, 10) : undefined,
    };

    await this.userRepository.save(newData);

    if (image && oldImage) await this.filesService.deleteImage(oldImage.id);

    const updatedUser = await this.userRepository.findOneBy({ id: user.id });

    return this.profile(updatedUser);
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

  async profile(user: User) {
    const { image, ...userData } = user;

    return { ...userData, image: image?.url || null };
  }

  async resendVerificationCode(user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
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

      return {
        message: `forwarded verification code to email ${user.email}`,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async verify(user: User, verificationCodeDto: VerificationCodeDto) {
    const { code } = verificationCodeDto;

    if (user.isVerified)
      throw new BadRequestException(ResMessages.UserAlreadyVerified);

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userVerificationCode = await this.userCodeVerificationRepository
        .createQueryBuilder()
        .where('"userId"=:userId and code=:code', { userId: user.id, code })
        .getOne();

      if (!userVerificationCode)
        throw new NotFoundException("Verification code isn't not exits");

      if (userVerificationCode.isUsed)
        throw new BadRequestException('Verification code is already used');

      const expireDate = new Date(userVerificationCode.expireIn).getTime();

      if (Date.now() > expireDate)
        throw new BadRequestException('Verification code is expired');

      userVerificationCode.isUsed = true;
      user.isVerified = true;

      await queryRunner.manager.save(User, user);
      await queryRunner.manager.save(
        UserVerificationCode,
        userVerificationCode,
      );

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { message: 'User verificated' };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  // **************** utils ****************

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

    if (error.status == 404) throw new NotFoundException(error.response);

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
