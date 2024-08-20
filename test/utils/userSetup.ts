import { Server } from 'http';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { User, UserVerificationCode } from '../../src/auth/entities';
import { getUser } from './getUser';
import { usersNotVerify, usersToVerify } from '../data';

interface options {
  userRepository: Repository<User>;
  verifyCodeRepository: Repository<UserVerificationCode>;
  server: Server;
}

export interface UserAndToken {
  user: User;
  token: string;
}

export const userSetup = async ({
  userRepository,
  verifyCodeRepository,
  server,
}: options): Promise<{ verify: UserAndToken[]; notVerify: UserAndToken[] }> => {
  const notVerify: UserAndToken[] = [];
  const verify: UserAndToken[] = [];
  // crear

  try {
    for (const userData of usersNotVerify) {
      const {
        body: { data: user, token },
      } = await request(server).post('/auth/register').send(userData);

      notVerify.push({ user, token });
    }

    for (const userData of usersToVerify) {
      const {
        body: { data: user, token },
      } = await request(server).post('/auth/register').send(userData);

      verify.push({ user, token });
    }

    // verificar
    for (let index = 0; index < verify.length; index++) {
      const { token, user } = verify[index];

      const { id: userId, email } = user;

      const verificationCode = await verifyCodeRepository.findOneBy({ userId });

      await request(server)
        .post('/auth/verify')
        .set('Authorization', `Bearer ${token}`)
        .send({ code: verificationCode.code });

      verify[index].user = await getUser(userRepository, email);
    }

    return { notVerify, verify };
  } catch (error) {
    console.log(error);
  }
};
