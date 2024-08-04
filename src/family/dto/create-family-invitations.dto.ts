import {
  ArrayMinSize,
  IsArray,
  IsEmail,
  IsIn,
  IsString,
  ValidateNested,
} from 'class-validator';
import { FamilyRoles } from '../interfaces';
import { Type } from 'class-transformer';

export class FamilyInvitationDto {
  @IsEmail()
  guestEmail: string;

  @IsString()
  @IsIn(Object.values(FamilyRoles))
  role: FamilyRoles;
}

export class CreateFamilyInvitationsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  @Type(() => FamilyInvitationDto)
  invitations: FamilyInvitationDto[];
}
