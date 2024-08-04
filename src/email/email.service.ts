import { Injectable } from '@nestjs/common';
import { EmailSender } from 'src/email/providers/email-sender';
import { CreateUserEmailDto } from './dto/create-user-email.dto';
import { EmailTemplates } from './providers/email-templates';

@Injectable()
export class EmailService {
  constructor(
    private readonly emailSender: EmailSender,
    private readonly emailTemplates: EmailTemplates,
  ) {}

  async sendEmail_CreateUser(createUserEmailDto: CreateUserEmailDto) {
    const { user } = createUserEmailDto;

    const html = this.emailTemplates.createUser(createUserEmailDto);

    await this.emailSender.send(user.email, 'User register', html);
  }

  // todo: crear logica para enviar correos a los invitados
  async sendEmail_InviteUsers() {}
}
