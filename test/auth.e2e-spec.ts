import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { Repository } from 'typeorm';
import { User, UserVerificationCode } from '../src/auth/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ResMessages } from '../src/common/providers';
import { getUser } from './utils/getUser';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let resMessage: ResMessages;

  const user_test_1_Credentials = {
    email: 'user_test_1@gmail.com',
    password: 'Ab123456.',
  };
  let token_test_1: string;
  let user_test_1: User;

  const user_test_2_Credentials = {
    email: 'user_test_2@gmail.com',
    password: 'Ab123456.',
  };
  let token_test_2: string;
  let user_test_2: User;

  const user_test_1_FullInfoToCreate = {
    name: 'user_test_1',
    lastName: 'dev',
    ...user_test_1_Credentials,
    birthday: new Date('2002-04-30'),
  };

  const user_test_2_MinimunInfoToCreate = {
    ...user_test_2_Credentials,
    name: 'user_test_2',
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      providers: [
        {
          provide: APP_PIPE,
          useValue: new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
          }),
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();

    userVerificationCodeRepository = moduleFixture.get<
      Repository<UserVerificationCode>
    >(getRepositoryToken(UserVerificationCode));

    userRepository = moduleFixture.get<Repository<User>>(
      getRepositoryToken(User),
    );

    resMessage = moduleFixture.get(ResMessages);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(async () => {
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});
    server.close();
  });

  describe('create user account', () => {
    it('should failed by bad email', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({
          ...user_test_1_FullInfoToCreate,
          email: 'user_test_1@',
        });

      expect(res.status).toBe(400);
    });

    it('should failed by bad date', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({
          ...user_test_1_FullInfoToCreate,
          birthday: 'not date',
        });

      expect(res.status).toBe(400);
    });

    it('should failed if has weak password', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send({ ...user_test_1_FullInfoToCreate, password: '123' });

      expect(res.status).toBe(400);
    });

    it('should create user account successfull with the minimun info', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send(user_test_2_MinimunInfoToCreate);

      expect(res.status).toBe(201);

      const { data, token, message } = res.body;

      const user = await getUser(userRepository, user_test_2_Credentials.email);

      user_test_2 = user;

      expect(user).toBeDefined();
      expect(data).toEqual(user);
      expect(token).toBeDefined();
      expect(message).toBe(resMessage.userRegisterSuccess);
    });

    it('should create user account successfull', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send(user_test_1_FullInfoToCreate);

      expect(res.status).toBe(201);

      const { data, token, message } = res.body;

      user_test_1 = await getUser(
        userRepository,
        user_test_1_Credentials.email,
      );

      expect(user_test_1).toBeDefined();
      expect(data).toEqual(user_test_1);
      expect(token).toBeDefined();
      expect(message).toBe(resMessage.userRegisterSuccess);
    });

    it('should fail to create user because email already register', async () => {
      const res = await request(server)
        .post('/auth/register')
        .send(user_test_1_FullInfoToCreate);

      const { message } = res.body;

      expect(res.status).toBe(400);
      expect(message).toBe(resMessage.userAlreadyRegisted);
    });

    // fallar porque no se encuentra la imagen que puso el usuario
  });

  describe('login', () => {
    it('should 400 bad request for incorrect email', async () => {
      await request(server)
        .post('/auth/login')
        .send({ ...user_test_1_Credentials, email: 'google' })
        .expect(400);
    });

    it('should 400 bad request for not strong password ', async () => {
      await request(server)
        .post('/auth/login')
        .send({ ...user_test_1_Credentials, password: '12' })
        .expect(400);
    });

    it('should 400 bad request for email not registed', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ ...user_test_1_Credentials, email: 'google@gmail.com' })
        .expect(400);

      const { message } = res.body;

      expect(message).toBe(resMessage.userIncorrectLogin);
    });

    it('should 400 bad request for incorrect password ', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send({ ...user_test_1_Credentials, password: '123456739Gb..' })
        .expect(400);

      const { message } = res.body;

      expect(message).toBe(resMessage.userIncorrectLogin);
    });

    it('should success login', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send(user_test_1_Credentials)
        .expect(200);

      const { message, token } = res.body;

      expect(message).toBe(resMessage.userLoginSuccess);
      expect(token).toBeDefined();

      token_test_1 = token;
    });

    it('should success login user_test_2', async () => {
      const res = await request(server)
        .post('/auth/login')
        .send(user_test_2_Credentials)
        .expect(200);

      const { message, token } = res.body;

      expect(message).toBe(resMessage.userLoginSuccess);
      expect(token).toBeDefined();

      token_test_2 = token;
    });
  });

  describe('get profile', () => {
    it('should status 401 by token not provided', async () => {
      await request(server).get('/auth/profile').expect(401);
    });

    it('should user profile', async () => {
      const res = await request(server)
        .get('/auth/profile')
        .set('Authorization', `Bearer ${token_test_1}`)
        .expect(200);

      expect(res.body.data).toEqual(user_test_1);
    });
  });

  describe('verification code', () => {
    // que exista el codigo
    it('should exist verify code', async () => {
      const code = await userVerificationCodeRepository.findOne({
        where: { userId: user_test_1.id },
      });

      expect(code).toBeDefined();
    });

    // usuario no logueado
    it('should status 400 user no logged', async () => {
      const { body } = await request(server).post('/auth/verify').expect(401);

      expect(body.message).toBe('Unauthorized');
    });

    it('should status 400 code no provided', async () => {
      await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token_test_1}`)
        .expect(400);
    });

    it('should status 400 invalid code ', async () => {
      await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token_test_1}`)
        .send({ code: 'asdas' })
        .expect(400);
    });

    it('should status 404 code not found', async () => {
      await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token_test_1}`)
        .send({ code: '0000' })
        .expect(404);
    });

    it('should verify user ', async () => {
      const verificationCode = await userVerificationCodeRepository.findOneBy({
        userId: user_test_1.id,
      });

      expect(verificationCode).toBeDefined;

      const res = await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token_test_1}`)
        .send({ code: verificationCode.code })
        .expect(200);

      const { message } = res.body;
      expect(message).toBe(resMessage.userVerifySuccess);

      const user = await getUser(userRepository, user_test_1_Credentials.email);
      const verificationCodeUsed =
        await userVerificationCodeRepository.findOneBy({
          id: verificationCode.id,
        });

      expect(user.isVerified).toBe(true);
      expect(verificationCodeUsed).toBeFalsy();
    });

    it('should status 400 user already verifiy  ', async () => {
      const res = await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token_test_1}`)
        .send({ code: '1234' })
        .expect(400);

      const { message } = res.body;
      expect(message).toBe(resMessage.userAlreadyVerified);
    });

    it('should status 400 verify code expired', async () => {
      const code = await userVerificationCodeRepository.findOneBy({
        userId: user_test_2.id,
      });

      expect(code).toBeDefined();
      code.expireIn = new Date('2000').toISOString();
      await userVerificationCodeRepository.save(code);

      const res = await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token_test_2}`)
        .send({ code: code.code })
        .expect(400);

      const { message } = res.body;
      expect(message).toBe(resMessage.userVerifyCodeExpired);
    });

    // todo: reenviar el codigo
  });
});
