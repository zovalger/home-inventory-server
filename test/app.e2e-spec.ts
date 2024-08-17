import { Server } from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { AppModule } from './../src/app.module';

import { Repository } from 'typeorm';
import { User, UserVerificationCode } from '../src/auth/entities';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ResMessages } from '../src/common/providers';
import { File } from '../src/files/entities';

describe('App (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let resMessage: ResMessages;

  

  beforeEach(async () => {
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

  it('server defined', () => {
    expect(server).toBeDefined();
  });

  afterAll(async () => {
    server.close();
  });
});
