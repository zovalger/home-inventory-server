export interface UserData {
  email: string;
  password: string;
  name: string;
  lastName?: string;
  birthday?: string | Date;
}

export const usersToVerify: UserData[] = [
  {
    email: 'user_test_1@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_1',
    lastName: 'dev',
    birthday: new Date('2002-04-30'),
  },
  {
    email: 'user_test_2@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_2',
  },
  {
    email: 'user_test_3@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_3',
  },
];

export const usersNotVerify: UserData[] = [
  {
    email: 'user_test_4@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_4',
    lastName: 'dev',
    birthday: new Date('2002-04-30'),
  },
  {
    email: 'user_test_5@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_5',
  },
  {
    email: 'user_test_6@gmail.com',
    password: 'Ab123456.',
    name: 'user_test_6',
  },
];
