import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { Server } from 'http';
import { Repository } from 'typeorm';
import { User, UserVerificationCode } from './../src/auth/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';

describe('App (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;

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

    await app.init();
    server = app.getHttpServer();

    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});
  });

  // it('login', () => {
  //   return request(server).get('/').expect(200).expect('Hello World!');
  // });

  describe('AuthModule (e2e)', () => {
    // crear cuenta

    const userCredentials = {
      email: 'zovalger@gmail.com',
      password: 'Ab123456.',
    };

    const userToCreate = {
      name: 'zovalger',
      lastName: 'dev',
      ...userCredentials,
      birthday: new Date('2002-04-30'),
    };

    describe('create user account', () => {
      it('should failed by bad email', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send({
            ...userToCreate,
            email: 'zovalger@',
          });

        expect(res.status).toBe(400);
      });

      it('should failed by bad date', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send({
            ...userToCreate,
            birthday: 'not date',
          });

        expect(res.status).toBe(400);
      });

      it('should failed if has weak password', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send({ ...userToCreate, password: '123' });

        expect(res.status).toBe(400);
      });

      it('should create user account successfull', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send(userToCreate);

        expect(res.status).toBe(201);

        const { data, token } = res.body;

        const user = await userRepository
          .createQueryBuilder()
          .where('email = :email', { email: userCredentials.email })
          .getOne();

        expect(user).toBeDefined();

        user.birthday = user.birthday
          ? new Date(user.birthday).toISOString()
          : null;
        user.createAt = new Date(user.createAt).toISOString();
        user.updateAt = new Date(user.updateAt).toISOString();

        expect(data).toEqual(user);
        expect(token).toBeDefined();
      });
    });

    describe('login', () => {
      it('should 400 bad request for email or password incorrect', async () => {
        const res = await request(server)
          .post('/auth/login')
          .send({ ...userCredentials, password: '12' });

        expect(res.status).toBe(400);
      });

      it('should 400 bad request for user not found', async () => {
        const res = await request(server)
          .post('/auth/login')
          .send({ ...userCredentials, email: 'google@gmail.com' });

        expect(res.status).toBe(400);
      });
    });

    // obtener perfil
    // usuario no encontrado
  });

  afterAll(() => {
    server.close();
  });
});
