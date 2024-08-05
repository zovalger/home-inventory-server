import { Injectable } from '@nestjs/common';

import { CreateUserEmailDto } from '../dto';
import {
  BasicEmailTemplate,
  CreateUserEmailTemplate,
  InviteUserToMemberTemplate,
} from '../templates';
import { FamilyInvitationDto } from 'src/family/dto/create-family-invitations.dto';

interface EmailTemplate {
  subject: string;
  html: string;
}
@Injectable()
export class EmailTemplates {
  constructor() {}

  basicEmail(body: string) {
    return BasicEmailTemplate(body);
  }

  createUser(createUserEmailDto: CreateUserEmailDto): EmailTemplate {
    const body = CreateUserEmailTemplate(createUserEmailDto);
    const html = this.basicEmail(body);

    const subject = 'User register';

    return { subject, html };
  }

  inviteUserToMember(
    user: string,
    familyName: string,
    familyInvitationDto: FamilyInvitationDto,
  ): EmailTemplate {
    const body = InviteUserToMemberTemplate(
      user,
      familyName,
      familyInvitationDto,
    );

    const html = this.basicEmail(body);

    const subject = `Invitation of family group ${familyName} `;

    return { subject, html };
  }
}
