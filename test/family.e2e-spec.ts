import { Server } from 'http';
import { APP_PIPE } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import * as request from 'supertest';

import { Family, FamilyMember } from '../src/family/entities';
import { User, UserVerificationCode } from '../src/auth/entities';
import { ResMessages } from '../src/common/providers';
import { AppModule } from '../src/app.module';
import { UserAndToken, userSetup } from './utils';
import { familyData } from './data';

describe('FamilyModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let familyRepository: Repository<Family>;
  let familyMemerRepository: Repository<FamilyMember>;
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

    familyMemerRepository = moduleFixture.get<Repository<FamilyMember>>(
      getRepositoryToken(FamilyMember),
    );

    resMessage = moduleFixture.get(ResMessages);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    const { verify, notVerify } = await userSetup({
      userRepository,
      verifyCodeRepository: userVerificationCodeRepository,
      server,
    });

    usersAndToken = verify;
    usersAndTokenNotVerify = notVerify;
  });

  afterEach(async () => {
    await familyRepository.update(
      { imageUrl: Not(IsNull()) },
      { imageUrl: null },
    );
    await fileRepository.delete({});

    await familyMemerRepository.delete({});
    await familyRepository.delete({});
    await userVerificationCodeRepository.delete({});
    await userRepository.delete({});

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

        // todo: que pasa si el usuario esta en otro grupo
        // todo: valores nulos
        // todo: imagen no encontrada
      });

      describe('success', () => {
        it('only name', async () => {
          const { body } = await request(server)
            .post(endpointUrl)
            .set('Authorization', `Bearer ${usersAndToken[0].token}`)
            .send(familyData[0])
            .expect(201);

          const family = familyRepository.findOneBy({
            createById: usersAndToken[0].user.id,
          });

          expect(body.message).toBe(resMessage.familyCreated);
          expect(body.data).toBe(family);
        });
        // todo: imagen del grupo
        // todo: que el usuario se haya añadido correctamente a los miembros con rol ouwner
      });
    });

    describe('get family', () => {
      // todo: que pasa si no esta logueado
      // todo: que pasas si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: obtener grupo
    });

    describe('update family', () => {
      // todo: usuario no logueado
      // todo: usuario no verificado
      // todo: usuario sin grupo
      // todo: que pasa si el usuario no es ouwner
      // todo: que pasa si el usuario es ouwner de otro grupo
      // todo: valores nulos
      // todo: imagen no encontrada
      // todo: actualizar datos
      // todo: quitar imagen (null)
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
