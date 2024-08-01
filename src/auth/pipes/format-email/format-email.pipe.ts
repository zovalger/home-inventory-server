import { Injectable, PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class FormatEmailPipe implements PipeTransform {
  transform(value: any) {
    const { email } = value;

    try {
      value.email = email.toLocaleLowerCase();
    } catch (error) {
      throw new BadRequestException('Email not found');
    }

    return value;
  }
}
