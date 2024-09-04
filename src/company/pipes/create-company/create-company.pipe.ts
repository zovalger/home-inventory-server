import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CreateCompanyDto } from '../../dto/create-company.dto';

@Injectable()
export class CreateCompanyPipe implements PipeTransform {
  transform(value: CreateCompanyDto) {
    const name = value.name && value.name.trim();

    if (!name) throw new BadRequestException('bad name');

    // const imageUrl = value.imageUrl ? value.imageUrl : null;

    return {
      ...value,
      name,
      // imageUrl
    };
  }
}
