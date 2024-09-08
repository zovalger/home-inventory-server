import { User } from '../entities';
import { ValidRoles } from '../interface/valid-roles';

export const isAdmin = (user: User): boolean =>
  user.roles.includes(ValidRoles.admin);
