import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { UserVerificationCode, User } from './entities';

import { JwtPayload } from './interface';
import { CreateUserDto, VerificationCodeDto, LoginUserDto } from './dto';
import { UpdateUserDto } from './dto/update-user.dto';

import {
  ErrorHandleProvider,
  ResMessages,
  ResponseBodyFormat,
} from '../common/providers';
import { EmailService } from '../email/email.service';
import { FilesService } from '../files/files.service';
import { VerificationCodeService } from './verification-code/verification-code.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly responseBodyFormat: ResponseBodyFormat,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly filesService: FilesService,

    private readonly dataSource: DataSource,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly verificationCodeService: VerificationCodeService,
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

    const user = this.userRepository.create(userData);

    try {
      await queryRunner.manager.save(user);

      const verificationCode = this.verificationCodeService.create(user.id);

      await queryRunner.manager.save(verificationCode);

      await this.emailService.sendEmail_CreateUser({
        user,
        verificationCode,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      delete user.password;

      return this.responseBodyFormat.withToken(
        this.getJwtToken({ id: user.id }),
        this.resMessages.userRegisterSuccess,
        user,
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(
        error,
        this.resMessages.userAlreadyRegisted,
      );
    }
  }

  async login(loginUserDto: LoginUserDto) {
    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { id: true, email: true, password: true },
    });

    if (!user)
      throw new BadRequestException(this.resMessages.userIncorrectLogin);

    if (!bcrypt.compareSync(password, user.password))
      throw new BadRequestException(this.resMessages.userIncorrectLogin);

    return this.responseBodyFormat.withToken(
      this.getJwtToken({ id: user.id }),
      this.resMessages.userLoginSuccess,
    );
  }

  async profile(user: User) {
    return this.responseBodyFormat.basic(
      this.resMessages.userProfileObtained,
      user,
    );
  }

  async verify(user: User, verificationCodeDto: VerificationCodeDto) {
    const { code } = verificationCodeDto;

    if (user.isVerified)
      throw new BadRequestException(this.resMessages.userAlreadyVerified);

    const validCode = await this.verificationCodeService.getValidCode(
      user.id,
      code,
    );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    user.isVerified = true;

    try {
      await queryRunner.manager.save(User, user);
      await queryRunner.manager.delete(UserVerificationCode, {
        id: validCode.id,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.responseBodyFormat.basic(this.resMessages.userVerifySuccess);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async resendVerificationCode(user: User) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(UserVerificationCode, {
        userId: user.id,
      });

      const verificationCode = this.verificationCodeService.create(user.id);

      await queryRunner.manager.save(verificationCode);

      await this.emailService.sendEmail_CreateUser({
        user,
        verificationCode,
      });

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return this.responseBodyFormat.basic(
        this.resMessages.verifyCodeResend(user.email),
      );
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  // todo: hacer validacion al cambiar de email
  // enviar correo de confirmacion para cambiarlo

  async updateUser(user: User, updateUserDto: UpdateUserDto) {
    if (this.isObjetEmpty(updateUserDto))
      throw new BadRequestException(this.resMessages.objectEmpty);

    const { imageUrl: oldImageUrl } = user;
    const { imageUrl, password } = updateUserDto;

    if (password) updateUserDto.password = bcrypt.hashSync(password, 10);

    if (imageUrl) {
      const existImage = await this.filesService.existImageInDB(imageUrl);
      if (!existImage)
        throw new BadRequestException(this.resMessages.imageNotFound);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const userUpdated = await this.userRepository.preload({
        id: user.id,
        ...updateUserDto,
      });

      userUpdated.imageUrl = imageUrl !== undefined ? imageUrl : oldImageUrl;

      if (!userUpdated)
        throw new NotFoundException(this.resMessages.userNotFound);

      await queryRunner.manager.save(userUpdated);

      if (imageUrl !== undefined && oldImageUrl && imageUrl != oldImageUrl) {
        await this.filesService.deleteUserImageByQueryRunner(
          queryRunner,
          oldImageUrl,
        );
      }
      await queryRunner.commitTransaction();
      await queryRunner.release();

      delete userUpdated.password;

      return userUpdated;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  // **************** utils ****************

  private isObjetEmpty(obj: any) {
    return !Object.values(obj).find((v) => v != undefined && v != null);
  }

  private getJwtToken(jwtPayload: JwtPayload) {
    const token = this.jwtService.sign(jwtPayload);

    return token;
  }
}
