import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { EmailSender } from './providers/email-sender';
import { EmailTemplates } from './providers/email-templates';

import { EmailService } from './email.service';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailSender, EmailTemplates],
  exports: [EmailService],
})
export class EmailModule {}
