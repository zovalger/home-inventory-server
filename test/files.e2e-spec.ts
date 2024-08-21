import { Server } from 'http';

import * as request from 'supertest';
import { Test, TestingModule } from '@nestjs/testing';

import { APP_PIPE } from '@nestjs/core';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';

import { EnvConfiguration } from '../src/config/app.config';

import { File } from '../src/files/entities';
import { User, UserVerificationCode } from '../src/auth/entities';

import { UserAndToken, userSetup } from './utils/userSetup';
import { ResMessages } from '../src/common/providers';
import { AppModule } from '../src/app.module';

describe('FilesModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let resMessage: ResMessages;

  // *********************** users ***********************
  let usersAndToken: UserAndToken[];
  let usersAndTokenNotVerify: UserAndToken[];

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
    const { verify, notVerify } = await userSetup('files', {
      userRepository,
      verifyCodeRepository: userVerificationCodeRepository,
      server,
    });

    usersAndToken = verify;
    usersAndTokenNotVerify = notVerify;
  });

  afterEach(async () => {
    const usersId = [
      ...usersAndToken.map(({ user }) => user.id),
      ...usersAndTokenNotVerify.map(({ user }) => user.id),
    ];

    // todo: eliminar los archivos creados por los usuarios
    const files = await fileRepository.find();
    for (const file of files) {
      await request(server)
        .delete(`/files/${file.id}`)
        .set('Authorization', `Bearer ${usersAndToken[0].token}`)
        .expect(200);
    }

    await fileRepository.delete({ createById: In(usersId) });
    await userVerificationCodeRepository.delete({ userId: In(usersId) });
    await userRepository.delete({ id: In(usersId) });
    usersAndToken = [];
  });

  describe('upload file', () => {
    describe('fail', () => {
      it('user without token', async () => {
        try {
          await request(server)
            .post('/files/upload')
            .attach('file', './test/assets/small_image.jpg');
        } catch (error) {
          expect(error.code).toBe('ECONNRESET');
        }
      });

      it('user not verify', async () => {
        const { body } = await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
          .attach('file', './test/assets/small_image.jpg')
          .expect(401);

        expect(body.message).toBe(resMessage.userNotVerify);
      });

      it('file not attached', async () => {
        await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .expect(400);
      });

      it('file too large', async () => {
        const { body } = await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .attach('file', './test/assets/large_image.jpg')
          .expect(400);

        expect(body.message).toBe(
          resMessage.fileTooLarge(EnvConfiguration().max_image_size_bytes),
        );
      });

      it('array images', async () => {
        await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .attach('file', './test/assets/image.webp')
          .attach('file', './test/assets/small_image.jpg')
          .expect(400);
      });

      describe('diferent format', () => {
        it('pdf', async () => {
          await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/image.pdf')
            .expect(400);
        });

        it('exe', async () => {
          await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/image.exe')
            .expect(400);
        });

        it('gif', async () => {
          await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/image.gif')

            .expect(400);
        });
      });
    });

    describe('success create', () => {
      it('jpg', async () => {
        const res = await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .attach('file', './test/assets/small_image.jpg')
          .expect(201);

        expect(res.body.url).toBeDefined();
      });

      it('png', async () => {
        const res = await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .attach('file', './test/assets/image.png')
          .expect(201);

        expect(res.body.url).toBeDefined();
      });

      it('webp', async () => {
        const res = await request(server)
          .post('/files/upload')
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .attach('file', './test/assets/image.webp')
          .expect(201);

        expect(res.body.url).toBeDefined();
      });
    });

    describe('delete', () => {
      describe('fail by', () => {
        it('no token', async () =>
          await request(server).delete('/files/123456').expect(401));

        it('user no verify', async () =>
          await request(server)
            .delete('/files/123456')
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .expect(401));

        it('bad id', async () =>
          await request(server)
            .delete('/files/123456')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .expect(404));

        it('not found', async () =>
          await request(server)
            .delete('/files/061fdc52-ecbe-41e4-82ce-1457bfc49cfd')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .expect(404));

        it('other user', async () => {
          // subir imagen a eliminar
          const {
            body: { url },
          } = await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/image.png')
            .expect(201);

          const file = await fileRepository.findOneBy({ url });

          await request(server)
            .delete(`/files/${file.id}`)
            .set('Authorization', `Bearer ${usersAndToken[1].token}`)
            .expect(403);
        });
      });

      describe('success', () => {
        it('same user', async () => {
          // subir imagen a eliminar
          const {
            body: { url },
          } = await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/image.png')
            .expect(201);

          const file = await fileRepository.findOneBy({ url });

          await request(server)
            .delete(`/files/${file.id}`)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .expect(200);
        });
      });
    });
  });
});
