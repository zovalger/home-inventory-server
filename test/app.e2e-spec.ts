import { Server } from 'http';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_PIPE } from '@nestjs/core';

import { AppModule } from './../src/app.module';

describe('App (e2e)', () => {
  let app: INestApplication;
  let server: Server;

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
