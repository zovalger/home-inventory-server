import { Server } from 'http';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { CreateUserDto } from '../../src/auth/dto';
import { User, UserVerificationCode } from '../../src/auth/entities';

interface options {
  verifyCodeRepository: Repository<UserVerificationCode>;
  server: Server;
}

export interface UserAndToken {
  user: User;
  token: string;
}

export const userSetup = async (
  users: CreateUserDto[],
  verifyCount: number = 1,
  { verifyCodeRepository, server }: options,
): Promise<UserAndToken[]> => {
  const data: UserAndToken[] = [];

  // crear

  try {
    for (const userData of users) {
      const {
        body: { data: user, token },
      } = await request(server).post('/auth/register').send(userData);

      data.push({ user, token });
    }

    // verificar
    for (let index = 0; index < verifyCount; index++) {
      const {
        token,
        user: { id: userId },
      } = data[index];

      const verificationCode = await verifyCodeRepository.findOneBy({ userId });

      await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: verificationCode.code });
    }

    return data;
  } catch (error) {
    console.log(error);
  }
};
