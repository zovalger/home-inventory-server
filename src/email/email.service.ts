import { Injectable } from '@nestjs/common';
import { EmailSender } from 'src/email/providers/email-sender';
import { EmailTemplates } from './providers/email-templates';
import { CreateUserEmailDto, SendEmailInviteUserDto } from './dto';

@Injectable()
export class EmailService {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly emailTemplates: EmailTemplates,
  ) {}

  async sendEmail_CreateUser(createUserEmailDto: CreateUserEmailDto) {
    const { user } = createUserEmailDto;

    const { subject, html } =
      this.emailTemplates.createUser(createUserEmailDto);

    await this.emailSender.send(user.email, subject, html);
  }

  // todo: crear logica para enviar correos a los invitados
  async sendEmail_InviteUsers(SendEmailInviteUserDto: SendEmailInviteUserDto) {
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
