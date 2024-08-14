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
  });

  // it('login', () => {
  //   return request(server).get('/').expect(200).expect('Hello World!');
  // });

  describe('AuthModule (e2e)', () => {
    // crear cuenta
    const userData = {
      name: 'zovalger',
      lastName: 'dev',
      email: 'zovalger',
      password: 'Ab123456.',

      // birthday: new Date('30-04-2002').toDateString(),
    };

    describe('create user account', () => {
      // crear correctamente la cuenta
      it('should create user account successfull', async () => {
        const res = await request(server).post('/auth/register').send(userData);
        // .expect(200);

        console.log(res.body);

        // expect(res.body).toMatchObject(User);
      });

      // contraseña debil

      // dato mal
    });

    // contraseña o usuario incorrecta
    // login de cuenta
    // obtener perfil
    // usuario no encontrado
  });
});
