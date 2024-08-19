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
import { UserAndToken, userSetup } from './utils/userSetup';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let resMessage: ResMessages;

  // *********************** data ***********************
  // full info
  const userData_test_1 = {
    email: 'user_test_auth_1@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_1',
    lastName: 'dev',
    birthday: new Date('2002-04-30'),
  };

  // minimum info
  const userData_test_2 = {
    email: 'user_test_auth_2@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_2',
  };

  const userData_test_3 = {
    email: 'user_test_auth_3@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_3',
  };

  // *********************** users ***********************
  let usersAndToken: UserAndToken[];

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

    fileRepository = moduleFixture.get<Repository<File>>(
      getRepositoryToken(File),
    );

    resMessage = moduleFixture.get(ResMessages);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(() => {
    server.close();
  });

  afterEach(async () => {
    await fileRepository.delete({});
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});
    usersAndToken = [];
  });

  // ***********************************************************************************
  //                               creacion de cuenta
  // ***********************************************************************************

  describe('create user account', () => {
    const fakeUserData = {
      email: 'user_test_fake@gmail.com',
      password: 'Ab123456.',
      name: 'user_test_fake_1',
      lastName: 'dev',
      birthday: new Date('2002-04-30'),
    };

    describe('fail by', () => {
      it('bad email', async () =>
        await request(server)
          .post('/auth/register')
          .send({
            ...fakeUserData,
            email: 'user_test_1@',
          })
          .expect(400));

      it('bad date', async () =>
        await request(server)
          .post('/auth/register')
          .send({
            ...fakeUserData,
            birthday: 'not date',
          })
          .expect(400));

      it('has weak password', async () =>
        await request(server)
          .post('/auth/register')
          .send({ ...fakeUserData, password: '123' })
          .expect(400));

      it('null values ', async () =>
        await request(server)
          .post('/auth/register')
          .send({
            name: null,
            lastName: null,
            email: null,
            password: null,
          })
          .expect(400));

      it('because email already register', async () => {
        await request(server)
          .post('/auth/register')
          .send(fakeUserData)
          .expect(201);

        const res = await request(server)
          .post('/auth/register')
          .send(fakeUserData)
          .expect(400);

        const { message } = res.body;

        expect(message).toBe(resMessage.userAlreadyRegisted);
      });
    });

    describe('success', () => {
      it('with the minimun info', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send(userData_test_2)
          .expect(201);

        const { data, token, message } = res.body;

        const user = await getUser(userRepository, userData_test_2.email);

        expect(user).toBeDefined();
        expect(data).toEqual(user);
        expect(token).toBeDefined();
        expect(message).toBe(resMessage.userRegisterSuccess);
      });

      it('should create user account successfull', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send(userData_test_1)
          .expect(201);

        const { data, token, message } = res.body;

        const user = await getUser(userRepository, userData_test_1.email);

        expect(user).toBeDefined();
        expect(data).toEqual(user);
        expect(token).toBeDefined();
        expect(message).toBe(resMessage.userRegisterSuccess);
      });
    });
  });

  describe('with account', () => {
    // todo: fallar porque no se encuentra la imagen que puso el usuario
    beforeEach(async () => {
      usersAndToken = await userSetup(
        [userData_test_1, userData_test_2, userData_test_3],
        2,
        {
          verifyCodeRepository: userVerificationCodeRepository,
          server,
        },
      );
    });
    describe('login', () => {
      describe('fail', () => {
        it('should 400 bad request for incorrect email', async () =>
          await request(server)
            .post('/auth/login')
            .send({ password: userData_test_1.password, email: 'google' })
            .expect(400));

        it('should 400 bad request for not strong password ', async () =>
          await request(server)
            .post('/auth/login')
            .send({ email: userData_test_1.email, password: '12' })
            .expect(400));

        it('should 400 bad request for email not registed', async () => {
          const res = await request(server)
            .post('/auth/login')
            .send({
              password: userData_test_1.password,
              email: 'google@gmail.com',
            })
            .expect(400);

          const { message } = res.body;

          expect(message).toBe(resMessage.userIncorrectLogin);
        });

        it('should 400 bad request for incorrect password ', async () => {
          const res = await request(server)
            .post('/auth/login')
            .send({
              email: userData_test_1.email,
              password: '123456739Gb..',
            })
            .expect(400);

          const { message } = res.body;

          expect(message).toBe(resMessage.userIncorrectLogin);
        });
      });

      describe('success', () => {
        it('should success login', async () => {
          const { email, password } = userData_test_1;

          const res = await request(server)
            .post('/auth/login')
            .send({ email, password })
            .expect(200);

          const { message, token } = res.body;

          expect(message).toBe(resMessage.userLoginSuccess);
          expect(token).toBeDefined();
        });

        it('should success login user_test_2', async () => {
          const { email, password } = userData_test_1;

          const res = await request(server)
            .post('/auth/login')
            .send({ email, password })
            .expect(200);

          const { message, token } = res.body;

          expect(message).toBe(resMessage.userLoginSuccess);
          expect(token).toBeDefined();
        });
      });
    });

    // describe('get profile', () => {
    //   it('should status 401 by bad token', async () => {
    //     await request(server)
    //       .get('/auth/profile')
    //       .set('Authorization', `Bearer ${badToken}`)
    //       .expect(401);
    //   });
    //   it('should status 401 invalid token', async () => {
    //     await request(server).get('/auth/profile').expect(401);
    //   });
    //   it('should user profile', async () => {
    //     const res = await request(server)
    //       .get('/auth/profile')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .expect(200);
    //     expect(res.body.data).toEqual(user_test_1);
    //   });
    // });
    // describe('verification code', () => {
    //   // que exista el codigo
    //   it('should exist verify code', async () => {
    //     const code = await userVerificationCodeRepository.findOne({
    //       where: { userId: user_test_1.id },
    //     });
    //     expect(code).toBeDefined();
    //   });
    //   // usuario no logueado
    //   it('should status 400 user no logged', async () => {
    //     const { body } = await request(server).post('/auth/verify').expect(401);
    //     expect(body.message).toBe('Unauthorized');
    //   });
    //   it('should status 400 code no provided', async () => {
    //     await request(server)
    //       .post('/auth/verify')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .expect(400);
    //   });
    //   it('should status 400 invalid code ', async () => {
    //     await request(server)
    //       .post('/auth/verify')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send({ code: 'asdas' })
    //       .expect(400);
    //   });
    //   it('should status 404 code not found', async () => {
    //     await request(server)
    //       .post('/auth/verify')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send({ code: '0000' })
    //       .expect(404);
    //   });
    //   it('should verify user ', async () => {
    //     const verificationCode = await userVerificationCodeRepository.findOneBy({
    //       userId: user_test_1.id,
    //     });
    //     expect(verificationCode).toBeDefined;
    //     const res = await request(server)
    //       .post('/auth/verify')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send({ code: verificationCode.code })
    //       .expect(200);
    //     const { message } = res.body;
    //     expect(message).toBe(resMessage.userVerifySuccess);
    //     const user = await getUser(
    //       userRepository,
    //       user_test_auth_1_Credentials.email,
    //     );
    //     user_test_1 = user;
    //     const verificationCodeUsed =
    //       await userVerificationCodeRepository.findOneBy({
    //         id: verificationCode.id,
    //       });
    //     expect(user.isVerified).toBe(true);
    //     expect(verificationCodeUsed).toBeFalsy();
    //   });
    //   it('should status 400 user already verifiy  ', async () => {
    //     const res = await request(server)
    //       .post('/auth/verify')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send({ code: '1234' })
    //       .expect(400);
    //     const { message } = res.body;
    //     expect(message).toBe(resMessage.userAlreadyVerified);
    //   });
    //   it('should status 400 verify code expired', async () => {
    //     const code = await userVerificationCodeRepository.findOneBy({
    //       userId: user_test_2.id,
    //     });
    //     expect(code).toBeDefined();
    //     code.expireIn = new Date('2000').toISOString();
    //     await userVerificationCodeRepository.save(code);
    //     const res = await request(server)
    //       .post('/auth/verify')
    //       .set('Authorization', `Bearer ${token_test_2}`)
    //       .send({ code: code.code })
    //       .expect(400);
    //     const { message } = res.body;
    //     expect(message).toBe(resMessage.userVerifyCodeExpired);
    //   });
    // });
    // describe('Resend verification code', () => {
    //   // no estoy logueado
    //   it('should status 401 by bad token', async () => {
    //     await request(server)
    //       .get('/auth/profile')
    //       .set('Authorization', `Bearer ${badToken}`)
    //       .expect(401);
    //   });
    //   it('should status 401 by token not provided', async () => {
    //     await request(server).get('/auth/profile').expect(401);
    //   });
    //   it('success', async () => {
    //     const res = await request(server)
    //       .post('/auth/resend_code')
    //       .set('Authorization', `Bearer ${token_test_2}`)
    //       .expect(200);
    //     const { message } = res.body;
    //     expect(message).toBe(resMessage.verifyCodeResend(user_test_2.email));
    //     const verifyCodes = await userVerificationCodeRepository.findBy({
    //       userId: user_test_2.id,
    //     });
    //     expect(verifyCodes).toHaveLength(1);
    //     expect(verifyCodes[0]).toBeDefined();
    //   });
    // });
    // describe('edit user', () => {
    //   // no estoy logueado
    //   const dataToUpdate = {
    //     name: 'user_test_2_edit',
    //     lastName: '',
    //     password: 'Abc123456789.',
    //     birthday: new Date('2000-04-30'),
    //   };
    //   it('not token', async () => {
    //     await request(server).patch('/auth/edit').send(dataToUpdate).expect(401);
    //   });
    //   it('bad token', async () => {
    //     await request(server)
    //       .patch('/auth/edit')
    //       .set('Authorization', `Bearer ${token_test_2}`)
    //       .send(dataToUpdate)
    //       .expect(401);
    //   });
    //   it('user not verify', async () => {
    //     await request(server)
    //       .patch('/auth/edit')
    //       .set('Authorization', `Bearer ${token_test_2}`)
    //       .send(dataToUpdate)
    //       .expect(401);
    //   });
    //   it('email not acepted', async () => {
    //     await request(server)
    //       .patch('/auth/edit')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send({ ...dataToUpdate, email: 'email@email.com' })
    //       .expect(400);
    //   });
    //   it('values null', async () => {
    //     await request(server)
    //       .patch('/auth/edit')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send({
    //         password: null,
    //         birthday: null,
    //         lastName: null,
    //         name: null,
    //       })
    //       .expect(400);
    //     const user = await getUser(userRepository, user_test_1.email);
    //     expect(user).toEqual(user_test_1);
    //   });
    //   it('success', async () => {
    //     const res = await request(server)
    //       .patch('/auth/edit')
    //       .set('Authorization', `Bearer ${token_test_1}`)
    //       .send(dataToUpdate)
    //       .expect(200);
    //     const { name, lastName, password, birthday } = res.body;
    //     const user = await getUser(userRepository, user_test_1.email);
    //     expect(password).toBeUndefined();
    //     expect(name).toBe(user.name);
    //     expect(lastName).toBe(user.lastName);
    //     expect(birthday).toBe(user.birthday);
    //   });
    // });
  });
});
