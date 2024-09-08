import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { CreateCompanyDto } from '../../dto/create-company.dto';

@Injectable()
export class CreateCompanyPipe implements PipeTransform {
  transform(value: CreateCompanyDto) {
    const name = value.name && value.name.trim();
    if (!name) throw new BadRequestException('bad name');

    const rif_prefix = value.rif_prefix && value.rif_prefix.trim();
    const rif_number = value.rif_number && value.rif_number.trim();
    const address = value.address && value.address.trim();

    // const imageUrl = value.imageUrl ? value.imageUrl : null;

    return {
      ...value,
      name,
      rif_prefix,
      rif_number,
      address,
    };
  }
}
