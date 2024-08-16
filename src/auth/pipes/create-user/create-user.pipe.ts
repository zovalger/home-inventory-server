import { Injectable, PipeTransform } from '@nestjs/common';
import { CreateUserDto } from '../../dto';

@Injectable()
export class CreateUserPipe implements PipeTransform {
  transform(value: CreateUserDto) {
    const { name, email, lastName } = value;

    value.name = name.trim();
    value.email = email.toLocaleLowerCase().trim();

    if (lastName) value.lastName = lastName.trim();

    return value;
  }
}
