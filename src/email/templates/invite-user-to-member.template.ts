import { FamilyInvitationDto } from 'src/family/dto/create-family-invitations.dto';

export const InviteUserToMemberTemplate = (
  userName: string,
  familyName: string,
  familyInvitationDto: FamilyInvitationDto,
): string => {
  // const { role } = familyInvitationDto;

  //todo: enviar codigo de verificacion

  return `<h1>Family group invitation</h1>
  <br/>
  <p>The user ${userName} has invited you to join the family group ${familyName}</p>

  `;
};
