import { Injectable } from '@nestjs/common';

import { CreateUserEmailDto } from '../dto';
import { BasicEmailTemplate, CreateUserEmailTemplate } from '../templates';

@Injectable()
export class EmailTemplates {
  constructor() {}

  basicEmail(body: string) {
    return BasicEmailTemplate(body);
  }

  createUser(createUserEmailDto: CreateUserEmailDto): string {
    const body = CreateUserEmailTemplate(createUserEmailDto);
    const html = this.basicEmail(body);

    return html;
  }
}
