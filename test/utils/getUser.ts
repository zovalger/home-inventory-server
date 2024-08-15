import { Repository } from 'typeorm';
import { User } from '../../src/auth/entities';

export const getUser = async (
  userRepository: Repository<User>,
  email: string,
) => {
  const user = await userRepository.findOneBy({
    email,
  });

  user.birthday = user.birthday ? new Date(user.birthday).toISOString() : null;
  user.createAt = new Date(user.createAt).toISOString();
  user.updateAt = new Date(user.updateAt).toISOString();

  return user;
};
