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

describe('FamilyModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let resMessage: ResMessages;

  // *********************** data ***********************
  // full info
  const userData_test_1 = {
    email: 'user_test_family_1@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_1',
    lastName: 'dev',
    birthday: new Date('2002-04-30'),
  };

  // minimum info
  const userData_test_2 = {
    email: 'user_test_family_2@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_2',
  };

  const userData_test_3 = {
    email: 'user_test_family_3@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_3',
  };

  const badToken = '123456789';
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

  beforeEach(async () => {
    usersAndToken = await userSetup(
      [userData_test_1, userData_test_2, userData_test_3],
      2,
      {
        userRepository,
        verifyCodeRepository: userVerificationCodeRepository,
        server,
      },
    );
  });

  afterEach(async () => {
    await fileRepository.delete({});
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});
    usersAndToken = [];
  });



  describe("Create family",()=>{
    
  })
});
