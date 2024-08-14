import { Injectable } from '@nestjs/common';

import { CreateUserEmailDto, SendEmailInviteUserDto } from './dto';

import { EmailTemplates } from './providers/email-templates';
import { EmailSender } from './providers/email-sender';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly emailSender: EmailSender,
    private readonly emailTemplates: EmailTemplates,
  ) {}

  isTestingMode() {
    return this.configService.get('NODE_ENV') == 'test';
  }

  async sendEmail_CreateUser(createUserEmailDto: CreateUserEmailDto) {
    if (this.isTestingMode()) return;

    const { user } = createUserEmailDto;

    const { subject, html } =
      this.emailTemplates.createUser(createUserEmailDto);

    await this.emailSender.send(user.email, subject, html);
  }

  async sendEmail_InviteUsers(SendEmailInviteUserDto: SendEmailInviteUserDto) {
    if (this.isTestingMode()) return;

    const { familyName, createByUserName, invitations } =
      SendEmailInviteUserDto;

    for (const invitation of invitations) {
      try {
        const { guestEmail } = invitation;

        const { subject, html } = this.emailTemplates.inviteUserToMember(
          createByUserName,
          familyName,
          invitation,
        );

        await this.emailSender.send(guestEmail, subject, html);
      } catch (error) {
        console.log(error);
      }
    }
  }
}
