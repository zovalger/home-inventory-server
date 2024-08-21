import { Server } from 'http';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In, IsNull, Not, Repository } from 'typeorm';
import * as request from 'supertest';

import { Family, FamilyMember } from '../src/family/entities';
import { User, UserVerificationCode } from '../src/auth/entities';
import { ResMessages } from '../src/common/providers';
import { AppModule } from '../src/app.module';
import { getFamily, UserAndToken, userSetup } from './utils';
import { familyData } from './data';
import { File } from '../src/files/entities';
import { FamilyRoles } from '../src/family/interfaces';

describe('FamilyModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let familyRepository: Repository<Family>;
  let familyMemberRepository: Repository<FamilyMember>;
  let resMessage: ResMessages;

  const endpointUrl = '/family';

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

    familyRepository = moduleFixture.get<Repository<Family>>(
      getRepositoryToken(Family),
    );

    familyMemberRepository = moduleFixture.get<Repository<FamilyMember>>(
      getRepositoryToken(FamilyMember),
    );

    resMessage = moduleFixture.get(ResMessages);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(() => {
    server.close();
  });

  afterEach(async () => {
    await familyRepository.update(
      { imageUrl: Not(IsNull()) },
      { imageUrl: null },
    );
    await fileRepository.delete({});

    await familyMemberRepository.delete({});
    await familyRepository.delete({});
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});

    usersAndToken = [];
  });

  beforeEach(async () => {
    const { verify, notVerify } = await userSetup('family', {
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

    await familyRepository.update(
      { createById: In(usersId), imageUrl: Not(IsNull()) },
      { imageUrl: null },
    );

    const files = await fileRepository.findBy({ createById: In(usersId) });
    for (const file of files) {
      await request(server)
        .delete(`/files/${file.id}`)
        .set('Authorization', `Bearer ${usersAndToken[0].token}`)
        .expect(200);
    }

    await fileRepository.delete({ createById: In(usersId) });

    await familyMemberRepository.delete({ userId: In(usersId) });
    await familyRepository.delete({ createById: In(usersId) });
    await userVerificationCodeRepository.delete({ userId: In(usersId) });
    await userRepository.delete({ id: In(usersId) });
    usersAndToken = [];
  });

  describe('family group', () => {
    describe('Create family', () => {
      describe('fail', () => {
        it('user without token', async () => {
          await request(server).post(endpointUrl).expect(401);
        });

        it('bad token', async () => {
          await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${badToken}`)
            .expect(401);
        });

        it('user not verify', async () => {
          const { body } = await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
            .expect(401);

          expect(body.message).toBe(resMessage.userNotVerify);
        });

        it('null values', async () => {
          await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({ name: null, imageUrl: null })
            .expect(400);
        });

        it('user in other group', async () => {
          await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send(familyData[0])
            .expect(201);

          const { body } = await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send(familyData[0])
            .expect(400);

          expect(body.message).toBe(resMessage.userAlreadyInFamilyGroup);
        });

        it('image not found', async () => {
          const { body } = await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({ ...familyData[0], imageUrl: 'http://badurl.jpg' })
            .expect(400);

          expect(body.message).toBe(resMessage.imageNotFound);
        });
      });

      describe('success', () => {
        it('only name', async () => {
          const { body } = await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send(familyData[0])
            .expect(201);

          const family = await getFamily(
            familyRepository,
            usersAndToken[0].user.id,
          );

          expect(body.message).toBe(resMessage.familyCreated);
          expect(body.data).toEqual(family);

          const member = await familyMemberRepository.findOneBy({
            familyId: family.id,
          });

          expect(member.role).toBe(FamilyRoles.ouwner);
          expect(member.userId).toBe(usersAndToken[0].user.id);
        });

        it('with image', async () => {
          const {
            body: { url },
          } = await request(server)
            .post('/files/upload')
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .attach('file', './test/assets/small_image.jpg')
            .expect(201);

          expect(url).toBeDefined();

          const { body } = await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send({ ...familyData[0], imageUrl: url })
            .expect(201);

          const family = await getFamily(
            familyRepository,
            usersAndToken[0].user.id,
          );

          expect(body.message).toBe(resMessage.familyCreated);
          expect(body.data).toEqual(family);

          const member = await familyMemberRepository.findOneBy({
            familyId: family.id,
          });

          expect(member.role).toBe(FamilyRoles.ouwner);
          expect(member.userId).toBe(usersAndToken[0].user.id);
        });
      });
    });

    describe('with family', () => {
      beforeEach(async () => {
        await request(server)
          .post(endpointUrl)
          .set('Authorization', `Bearer ${usersAndToken[0].token}`)
          .send(familyData[0])
          .expect(201);
      });

      describe('get family', () => {
        describe('fail', () => {
          it('user without token', async () => {
            await request(server).get(endpointUrl).expect(401);
          });

          it('bad token', async () => {
            await request(server)
              .get(endpointUrl)
              .set('Authorization', `Bearer ${badToken}`)
              .expect(401);
          });

          it('user not verify', async () => {
            const { body } = await request(server)
              .get(endpointUrl)
              .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
              .expect(401);

            expect(body.message).toBe(resMessage.userNotVerify);
          });

          it('not have family group', async () => {
            const { body } = await request(server)
              .get(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[2].token}`)
              .expect(404);

            expect(body.message).toBe(resMessage.familyNotFound);
          });
        });

        describe('success', () => {
          it('get family', async () => {
            const { body } = await request(server)
              .get(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .expect(200);

            expect(body.message).toBe(resMessage.familyObtained);

            const family = await getFamily(
              familyRepository,
              usersAndToken[0].user.id,
            );

            expect(body.data).toEqual(family);
          });
        });
      });

      describe('update family', () => {
        describe('fail', () => {
          it('user without token', async () => {
            await request(server).patch(endpointUrl).expect(401);
          });

          it('bad token', async () => {
            await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${badToken}`)
              .expect(401);
          });

          it('user not verify', async () => {
            const { body } = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndTokenNotVerify[0].token}`)
              .expect(401);

            expect(body.message).toBe(resMessage.userNotVerify);
          });

          it('not have family group', async () => {
            const { body } = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[2].token}`)
              .expect(404);

            expect(body.message).toBe(resMessage.familyNotFound);
          });

          it('image not found', async () => {
            const { body } = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .send({ imageUrl: 'http://badurl.jpg' })
              .expect(400);

            expect(body.message).toBe(resMessage.imageNotFound);
          });

          // todo: que pasa si el usuario no es ouwner

          it('not ouwner', async () => {
            const family = await getFamily(
              familyRepository,
              usersAndToken[0].user.id,
            );

            await familyMemberRepository.insert({
              familyId: family.id,
              userId: usersAndToken[1].user.id,
              role: FamilyRoles.admin,
            });

            const res = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[1].token}`)
              .send({ name: 'not ouwner' })
              .expect(401);

            expect(res.body.message).toBe(
              resMessage.userNotHavePermisionInFamily,
            );
          });

          // que pasa si el usuario es ouwner de otro grupo
          // pd: no es posible no se esta proporcionando un id
        });

        describe('success', () => {
          it('null values', async () => {
            const res = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .send({ name: null })
              .expect(200);

            expect(res.body.message).toBe(resMessage.familyUpdated);
          });

          it('with image', async () => {
            const {
              body: { url },
            } = await request(server)
              .post('/files/upload')
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .attach('file', './test/assets/small_image.jpg')
              .expect(201);

            expect(url).toBeDefined();

            const { body } = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .send({ name: 'other name', imageUrl: url })
              .expect(200);

            const family = await getFamily(
              familyRepository,
              usersAndToken[0].user.id,
            );

            expect(body.message).toBe(resMessage.familyUpdated);
            expect(body.data).toEqual(family);
          });

          it('quit image', async () => {
            const {
              body: { url },
            } = await request(server)
              .post('/files/upload')
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .attach('file', './test/assets/small_image.jpg')
              .expect(201);

            expect(url).toBeDefined();

            await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .send({ name: 'other name', imageUrl: url })
              .expect(200);

            const { body } = await request(server)
              .patch(endpointUrl)
              .set('Authorization', `Bearer ${usersAndToken[0].token}`)
              .send({ imageUrl: null })
              .expect(200);

            const family = await getFamily(
              familyRepository,
              usersAndToken[0].user.id,
            );

            expect(body.message).toBe(resMessage.familyUpdated);
            expect(body.data.imageUrl).toBeNull();
            expect(family.imageUrl).toBeNull();
          });
        });
      });
    });

    describe('members', () => {
      describe('get all', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si no es miembro de ningun grupo
        // todo: obtener miembros
      });

      describe('change role', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si no es miembro de ningun grupo
        // todo: que pasa si el usuario no es ouwner
        // todo: que pasa si el usuario es ouwner de otro grupo
        // todo: que pasa si el miembro no existe
        // todo: que pasa si el miembro es de otro grupo
        // todo: valores nulos
        // todo: valores fuera de los permitidos
        // todo: que pasa si el usuario se cambia el rol a si mismo
        // todo: cambiar el rol
      });

      describe('delete member', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si no es miembro de ningun grupo
        // todo: que pasa si no cumple con el rol ouwner, admin o adul
        // todo: miembro no existe
        // todo: que pasa si el miembro es de otra familia
        // todo: que pasa si el ouwner es de otra familia
        // todo: que pasa si el ouwner se elimina a si mismo
        // todo: que pasa si un children se elimina asi mismo
        // todo: eliminar miembro
        // todo: que pasa si un ouwner elimina a otro user
        // todo: que pasa si un admin o adult se elimina a si mismo
      });
    });

    describe('invitations', () => {
      describe('create', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si no es miembro de ningun grupo
        // todo: que pasa si no cumple con el rol ouwner
        // todo: valores nulos
        // todo: que pasa si se crea una invitacion con rol ouwner
        // todo: algun email con mal formateado
        // todo: crear las invitaciones
      });

      describe('get invitations of family', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si no es miembro de ningun grupo
        // todo: que pasa si no cumple con el rol ouwner
        // todo: obtener las invitaciones
      });

      describe('get invitation to my', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: obtener las invitaciones
      });

      describe('accept', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si la invitacion no existe
        // todo: que pasa si acepta un usuario que no sea el invitado
        // todo: que pasa si el invitado ya es miembro de otro grupo
        // todo: que pasa si ya es miembro del mismo grupo
        // todo: que pasa si la invitacion ya a sido aceptada, rechazada o cancelada
      });

      describe('reject', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si la invitacion no existe
        // todo: que pasa si la rechaza un usuario que no sea el invitado
        // todo: que pasa si la invitacion ya a sido aceptada o cancelada
        // todo: rechazar
      });

      describe('cancel', () => {
        // todo: que pasa si no esta logueado
        // todo: que pasa si no esta verificado
        // todo: que pasa si la invitacion no existe
        // todo: que pasa si la cancela un usuario que no sea el ouwner
        // todo: que pasa si la cancela un owner de otro grupo
        // todo: que pasa si la invitacion ya a sido aceptada o rechazada
        // todo: canelar
      });
    });
  });
});
