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
import { File } from '../src/files/entities';

describe('FilesModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let resMessage: ResMessages;

  const user_test_1_without_verification = {
    email: 'user_test_1@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_1',
    lastName: 'dev',

    birthday: new Date('2002-04-30'),
  };

  let test_1_token_without_verification: string;

  const user_test_2 = {
    email: 'user_test_2@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_2',
    lastName: 'dev',

    birthday: new Date('2002-04-30'),
  };

  let test_2_token_with_verification: string;

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

    const res = await request(server)
      .post('/auth/register')
      .send(user_test_1_without_verification)
      .expect(201);

    test_1_token_without_verification = res.body.token;

    const {
      body: { data, token: token2 },
    } = await request(server)
      .post('/auth/register')
      .send(user_test_2)
      .expect(201);

    test_2_token_with_verification = token2;

    const verificationCode = await userVerificationCodeRepository.findOneBy({
      userId: data.id,
    });

    await request(server)
      .post('/auth/verify')
      .set('Authorization', `Bearer ${test_2_token_with_verification}`)
      .send({ code: verificationCode.code })
      .expect(200);
  });

  afterAll(async () => {
    await fileRepository.delete({});
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});
    server.close();
  });

  describe('upload file', () => {
    describe('fail', () => {
      it('should not token', async () => {
        const res = await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${test_2_token_with_verification}`)
          .attach('file', './test/assets/small_image.jpg');
        // .expect(201);

        console.log(res.body);
      });

      // it('should user not verify', async () => {
      //   const res = await request(server)
      //     .post('/files/upload')
      //     .set('Authorization', `Bearer ${test_2_token_with_verification}`)
      //     .attach('file', './test/assets/small_image.jpg')
      //     .expect(201);

      //   const { url } = res.body;

      //   expect(url).toBeDefined();
      // });

      // file too large
      // archivo no otorgado
    });

    // it('file created', async () => {
    //   const res = await request(server)
    //     .post('/files/upload')
    //     .set('Authorization', `Bearer ${test_2_token_with_verification}`)
    //     .attach('file', './test/assets/small_image.jpg')
    //     .expect(201);

    //   const { url } = res.body;

    //   expect(url).toBeDefined();
    // });

    // it('upload without verification', async () => {

    //   await request(server)
    //   .post('/files/upload')
    //   .attach('file', )
    //   .send({ code: verificationCode.code })
    //   .expect(200);

    // });
  });
});
