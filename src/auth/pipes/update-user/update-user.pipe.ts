import { Injectable, PipeTransform } from '@nestjs/common';
import { UpdateUserDto } from '../../dto';

@Injectable()
export class UpdateUserPipe implements PipeTransform {
  transform(value: UpdateUserDto) {
    const { name, lastName, imageUrl, password } = value;

    value.name =
      typeof name == 'string' && name.trim() ? name.trim() : undefined;
    value.password = typeof password == 'string' ? password : undefined;

    value.lastName =
      typeof lastName == 'string' && lastName.trim()
        ? lastName.trim()
        : undefined;

    value.imageUrl =
      typeof imageUrl == 'string' && imageUrl.trim()
        ? imageUrl.trim()
        : undefined;

    return value;
  }
}
