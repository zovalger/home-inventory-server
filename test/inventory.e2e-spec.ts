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
import { UserAndToken, userSetup, getUser } from './utils';
import {
  Product,
  ProductEquivalence,
  ProductTransaction,
} from '../src/inventory/entities';
import { File } from '../src/files/entities';

describe('InventoryModule (e2e)', () => {
  let app: INestApplication;
  let server: Server;
  let userRepository: Repository<User>;
  let userVerificationCodeRepository: Repository<UserVerificationCode>;
  let fileRepository: Repository<File>;
  let familyRepository: Repository<Family>;
  let familyMemerRepository: Repository<FamilyMember>;
  let productRepository: Repository<Product>;
  let transactionRepository: Repository<ProductTransaction>;
  let productEquivalenceRepository: Repository<ProductEquivalence>;

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

    familyRepository = moduleFixture.get<Repository<Family>>(
      getRepositoryToken(Family),
    );

    familyMemerRepository = moduleFixture.get<Repository<FamilyMember>>(
      getRepositoryToken(FamilyMember),
    );

    productRepository = moduleFixture.get<Repository<Product>>(
      getRepositoryToken(Product),
    );

    transactionRepository = moduleFixture.get<Repository<ProductTransaction>>(
      getRepositoryToken(ProductTransaction),
    );

    productEquivalenceRepository = moduleFixture.get<
      Repository<ProductEquivalence>
    >(getRepositoryToken(ProductEquivalence));

    resMessage = moduleFixture.get(ResMessages);

    await app.init();
    server = app.getHttpServer();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(async () => {
    const { verify, notVerify } = await userSetup('products', {
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

    await transactionRepository.delete({});
    await productEquivalenceRepository.delete({});
    await productRepository.delete({});

    await familyMemerRepository.delete({ userId: In(usersId) });
    await familyRepository.delete({ createById: In(usersId) });
    await userVerificationCodeRepository.delete({ userId: In(usersId) });
    await userRepository.delete({ id: In(usersId) });
    usersAndToken = [];
  });

  describe('products', () => {
    describe('create product', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si no es ouwner o admin
      // todo: valores nulos
      // todo: producto duplicado
      // todo: que pasa si el producto esta archivado
      // todo: imagen no encontrada
      // todo: crear product
      // todo: producto sin imagen
    });

    describe('find', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: busqueda por nombre
      // todo: por marca
      // todo: modelo status
      // todo: lowstock
      // todo: paginacion
      // todo: usar otro usuario en otro grupo
      // todo: ver que no tengan los mismo productos
    });

    describe('find by id', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: obtener el producto
    });

    describe('update', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si el usuario no es de los roles permitidos
      // todo: valores nulos
      // todo: imagen no encontrada
      // todo: quitar imagen
      // todo: actualizar el producto
    });

    describe('move to archive', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si el usuario no es de los roles permitidos
      // todo: que pasa si el producto tiene equivalencias
      // todo: que pasa si el producto ya esta en el archivo
      // todo: mover al archivo
    });

    describe('unarchive', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si el usuario no es de los roles permitidos
    });
  });

  describe('equivalences', () => {
    describe('create', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si no es ouwner o admin
      // todo: valores nulos
      // todo: tipo de valores incorrectos
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si ya hay una equivalencia con los mismos productos
      // todo: que pasa si el producto esta archivado
      // todo: añadir equivalencia
    });

    describe('of product', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si no es ouwner o admin
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si el producto esta archivado
      // todo: obtener equivalencias del producto
    });

    describe('of family', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si no es ouwner o admin
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: obtener equivalencias del grupo
    });

    describe('update', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si no es ouwner o admin
      // todo: valores nulos
      // todo: tipo de valores incorrectos
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si no existe la equivalencia
      // todo: que pasa si la equivalencia no es del mismo grupo que el usuario
      // todo: cambiar la equivalencia
      // todo: cambiar el fromid
    });

    describe('delete', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si no es ouwner o admin
      // todo: valores nulos
      // todo: tipo de valores incorrectos
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si no existe la equivalencia
      // todo: que pasa si la equivalencia no es del mismo grupo que el usuario
      // todo: eliminar equivalencia
    });
  });

  describe('transactions', () => {
    describe('create', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: valores nulos
      // todo: tipo de valores incorrectos
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si el producto esta archivado
      // todo: que pasa si la transaccion referenciada no existe
      // todo: que pasa si la transaccion referenciada no es de tipo add o unpaking
      // todo: crear transaccion
      // todo: transaccion add
      // todo: transaccion subtract
      // todo: unpaking
    });

    describe('of product', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: que pasa si el producto no es del mismo grupo que el usuario
      // todo: que pasa si no existe el producto
      // todo: que pasa si el producto esta archivado
      // todo: obtener transacciones del producto
    });

    describe('of family', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: obtener transacciones
    });

    describe('delete', () => {
      // todo: que pasa si no tiene un token
      // todo: que pasa si no esta verificado
      // todo: que pasa si no es miembro de ningun grupo
      // todo: valores nulos
      // todo: que pasa si la transaccion no es del mismo grupo
      // todo: que pasa si no existe la transaccion
      // todo: eliminar equivalencia
      // todo: tipo add
      // todo: tipo subtract
      // todo: tipo unpacking
    });
  });
});
