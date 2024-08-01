import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailSender {
  constructor(private readonly configService: ConfigService) {}

  async send(to: string, subject: string, html: string) {
    const transporter = nodemailer.createTransport({
      service: 'hotmail',
      auth: {
        user: this.configService.get('SENDER_EMAIL'),
        pass: this.configService.get('SENDER_EMAIL_PASSWORD'),
      },
    });

    const mailOptions = {
      from: this.configService.get('SENDER_EMAIL'),
      to,
      subject,
      html,
    };

    // const info =
    await transporter.sendMail(mailOptions);
  }
}
