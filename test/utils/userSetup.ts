import { Server } from 'http';
import { Repository } from 'typeorm';
import * as request from 'supertest';

import { User, UserVerificationCode } from '../../src/auth/entities';
import { getUser } from './getUser';
import { IUserData, usersNotVerify, usersToVerify } from '../data';

interface options {
  userRepository: Repository<User>;
  verifyCodeRepository: Repository<UserVerificationCode>;
  server: Server;
}

export interface UserAndToken {
  data: IUserData;
  user: User;
  token: string;
}

export const userSetup = async (
  prefix: string,
  { userRepository, verifyCodeRepository, server }: options,
): Promise<{ verify: UserAndToken[]; notVerify: UserAndToken[] }> => {
  const notVerify: UserAndToken[] = [];
  const verify: UserAndToken[] = [];
  // crear

  try {
    for (const userData of usersNotVerify) {
      const { email } = userData;

      const {
        body: { data: user, token },
      } = await request(server)
        .post('/auth/register')
        .send({ ...userData, email: `${prefix}_${email}` });

      notVerify.push({ data: userData, user, token });
    }

    for (const userData of usersToVerify) {
      const { email } = userData;

      const {
        body: { data: user, token },
      } = await request(server)
        .post('/auth/register')
        .send({ ...userData, email: `${prefix}_${email}` });

      verify.push({ data: userData, user, token });
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
