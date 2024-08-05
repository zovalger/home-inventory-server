import { FamilyInvitationDto } from 'src/family/dto/create-family-invitations.dto';

export class SendEmail_InviteUserToFamilyGroupDto {
  createByUserName: string;
  familyName: string;
  invitations: FamilyInvitationDto[];
}
