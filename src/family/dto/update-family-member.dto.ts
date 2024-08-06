import { IsString, IsIn } from 'class-validator';
import { FamilyRoles } from '../interfaces';

export class UpdateFamilyMemberDto {
  @IsString()
  @IsIn(Object.values(FamilyRoles))
  role: FamilyRoles;
}
