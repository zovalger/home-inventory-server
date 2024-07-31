import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { EmailSender } from './providers/email-sender';
import { EmailTemplates } from './providers/email-templates';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, EmailSender, EmailTemplates],
  exports: [EmailService],
})
export class EmailModule {}
