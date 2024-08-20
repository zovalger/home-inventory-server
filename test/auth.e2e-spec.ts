import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Server } from 'http';
import { IsNull, Not, Repository } from 'typeorm';
import { User, UserVerificationCode } from '../src/auth/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { APP_PIPE } from '@nestjs/core';
import { ResMessages } from '../src/common/providers';
import { getUser } from './utils/getUser';
import { UserAndToken, userSetup } from './utils/userSetup';
import { File } from '../src/files/entities';
import { usersToVerify } from './data';

describe('AuthModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let resMessage: ResMessages;

  // *********************** users ***********************
  let usersAndToken: UserAndToken[];
  let usersAndTokenNotVerify: UserAndToken[];
  const badToken = '123456789';

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
    await userRepository.update(
      { imageUrl: Not(IsNull()) },
      { imageUrl: null },
    );

    await fileRepository.delete({});
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});
    usersAndToken = [];
  });

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
          .send(usersToVerify[1])
          .expect(201);

        const { data, token, message } = res.body;

        const user = await getUser(userRepository, usersToVerify[1].email);

        expect(user).toBeDefined();
        expect(data).toEqual(user);
        expect(token).toBeDefined();
        expect(message).toBe(resMessage.userRegisterSuccess);
      });

      it('should create user account successfull', async () => {
        const res = await request(server)
          .post('/auth/register')
          .send(usersToVerify[0])
          .expect(201);

        const { data, token, message } = res.body;

        const user = await getUser(userRepository, usersToVerify[0].email);

        expect(user).toBeDefined();
        expect(data).toEqual(user);
        expect(token).toBeDefined();
        expect(message).toBe(resMessage.userRegisterSuccess);
      });
    });
  });

  describe('with account', () => {
    beforeEach(async () => {
      const { verify, notVerify } = await userSetup({
        userRepository,
        verifyCodeRepository: userVerificationCodeRepository,
        server,
      });

      usersAndToken = verify;
      usersAndTokenNotVerify = notVerify;
    });
    describe('login', () => {
      describe('fail', () => {
        it('should 400 bad request for incorrect email', async () =>
          await request(server)
            .post('/auth/login')
            .send({ password: usersToVerify[0].password, email: 'google' })
            .expect(400));

        it('should 400 bad request for not strong password ', async () =>
          await request(server)
            .post('/auth/login')
            .send({ email: usersToVerify[0].email, password: '12' })
            .expect(400));

        it('should 400 bad request for email not registed', async () => {
          const res = await request(server)
            .post('/auth/login')
            .send({
              password: usersToVerify[0].password,
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
              email: usersToVerify[0].email,
              password: '123456739Gb..',
            })
            .expect(400);

          const { message } = res.body;

          expect(message).toBe(resMessage.userIncorrectLogin);
        });
      });

      describe('success', () => {
        it('should success login', async () => {
          const { email, password } = usersToVerify[0];

          const res = await request(server)
            .post('/auth/login')
            .send({ email, password })
            .expect(200);

          const { message, token } = res.body;

          expect(message).toBe(resMessage.userLoginSuccess);
          expect(token).toBeDefined();
        });

        it('should success login user_test_2', async () => {
          const { email, password } = usersToVerify[0];

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

    describe('get profile', () => {
      describe('fail', () => {
        it('should status 401 not token', async () =>
          await request(server).get('/auth/profile').expect(401));

        it('should status 401 by invalid token', async () => {
          await request(server)
            .get('/auth/profile')
            .set('Authorization', `Bearer ${badToken}`)

            .expect(401);
        });
      });

      it('should user profile', async () => {
        const {
          token,
          user: { email },
        } = usersAndToken[0];

        const userDB = await getUser(userRepository, email);

        const res = await request(server)
          .get('/auth/profile')
          .set('Authorization', `Bearer ${token}`)
          .expect(200);

        expect(res.body.data).toEqual(userDB);
      });
    });

    describe('verification code', () => {
      describe('fail', () => {
        it('should status 400 user no logged', async () => {
          const { body } = await request(server)
            .post('/auth/verify')
            .expect(401);

          expect(body.message).toBe('Unauthorized');
        });

        it('should status 400 code no provided', async () => {
          await request(server)
            .post('/auth/verify')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .expect(400);
        });

        it('should status 400 invalid code ', async () => {
          await request(server)
            .post('/auth/verify')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .send({ code: 'asdas' })
            .expect(400);
        });

        it('should status 404 code not found', async () => {
          await request(server)
            .post('/auth/verify')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .send({ code: '0000' })
            .expect(404);
        });

        it('should status 400 user already verifiy  ', async () => {
          const {
            body: { message },
          } = await request(server)
            .post('/auth/verify')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({ code: '1234' })
            .expect(400);

          expect(message).toBe(resMessage.userAlreadyVerified);
        });

        it('should status 400 verify code expired', async () => {
          const code = await userVerificationCodeRepository.findOneBy({
            userId: usersAndTokenNotVerify[0].user.id,
          });

          expect(code).toBeDefined();

          code.expireIn = new Date('2000').toISOString();

          await userVerificationCodeRepository.save(code);

          const {
            body: { message },
          } = await request(server)
            .post('/auth/verify')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .send({ code: code.code })
            .expect(400);

          expect(message).toBe(resMessage.userVerifyCodeExpired);
        });
      });

      describe('success', () => {
        it('should verify user ', async () => {
          const code = await userVerificationCodeRepository.findOne({
            where: { userId: usersAndTokenNotVerify[0].user.id },
          });
          expect(code).toBeDefined();

          const {
            body: { message },
          } = await request(server)
            .post('/auth/verify')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .send({ code: code.code })
            .expect(200);

          expect(message).toBe(resMessage.userVerifySuccess);

          const user = await getUser(
            userRepository,
            usersAndTokenNotVerify[0].user.email,
          );

          const verificationCodeUsed =
            await userVerificationCodeRepository.findOneBy({
              id: code.id,
            });

          expect(user.isVerified).toBe(true);
          expect(verificationCodeUsed).toBeFalsy();
        });
      });
    });

    describe('Resend verification code', () => {
      describe('fail', () => {
        it('should status 401 by token not provided', async () =>
          await request(server).get('/auth/profile').expect(401));

        it('should status 401 by bad token', async () =>
          await request(server)
            .get('/auth/profile')
            .set('Authorization', `Bearer ${badToken}`)
            .expect(401));
      });

      it('should resend code', async () => {
        const {
          body: { message },
        } = await request(server)
          .post('/auth/resend_code')
          .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
          .expect(200);

        const { id, email } = usersAndTokenNotVerify[0].user;

        expect(message).toBe(resMessage.verifyCodeResend(email));

        const verifyCodes = await userVerificationCodeRepository.findBy({
          userId: id,
        });

        expect(verifyCodes).toHaveLength(1);
        expect(verifyCodes[0]).toBeDefined();
      });
    });

    describe('edit user', () => {
      const dataToUpdate = {
        name: 'user_test_2_edit',
        lastName: '',
        password: 'Abc123456789.',
        birthday: new Date('2000-04-30'),
      };

      describe('fail', () => {
        it('not token', async () =>
          await request(server)
            .patch('/auth/edit')
            .send(dataToUpdate)
            .expect(401));

        it('bad token', async () => {
          await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${badToken}`)
            .send(dataToUpdate)
            .expect(401);
        });

        it('user not verify', async () =>
          await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .send(dataToUpdate)
            .expect(401));

        it('email not acepted', async () =>
          await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({ ...dataToUpdate, email: 'email@email.com' })
            .expect(400));

        it('null values', async () => {
          await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({
              password: null,
              birthday: null,
              lastName: null,
              name: null,
            })
            .expect(400);

          const { user: lastUserData } = usersAndToken[0];

          const user = await getUser(userRepository, lastUserData.email);

          expect(user).toEqual(lastUserData);
        });

        it('image not found', async () => {
          await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({
              imageUrl: 'http://imagen.png',
            })
            .expect(400);

          const { user: lastUserData } = usersAndToken[0];

          const user = await getUser(userRepository, lastUserData.email);

          expect(user).toEqual(lastUserData);
        });

        // todo: fallar porque no se encuentra la imagen que puso el usuario
      });

      describe('success', () => {
        it('rest of values', async () => {
          const {
            body: {
              data: { name, lastName, password, birthday },
            },
          } = await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send(dataToUpdate)
            .expect(200);

          const user = await getUser(
            userRepository,
            usersAndToken[0].user.email,
          );

          expect(password).toBeUndefined();
          expect(name).toBe(user.name);
          expect(lastName).toBe(user.lastName);
          expect(birthday).toBe(user.birthday);
        });

        it('change image', async () => {
          const {
            body: { url },
          } = await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/small_image.jpg')
            .expect(201);

          expect(url).toBeDefined();

          const res = await request(server)
            .patch('/auth/edit')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({ imageUrl: url })
            .expect(200);

          const userUpdated = res.body.data;

          const user = await getUser(
            userRepository,
            usersAndToken[0].user.email,
          );

          expect(userUpdated).toEqual(user);

          expect(user.imageUrl).toBe(url);
        });
      });
    });
  });
});
