import { Injectable, PipeTransform } from '@nestjs/common';
import { UpdateCompanyDto } from 'src/company/dto/update-company.dto';

@Injectable()
export class UpdateCompanyPipe implements PipeTransform {
  transform(value: UpdateCompanyDto) {
    const name = value.name ? value.name.trim() : undefined;
    const rif_prefix = value.rif_prefix ? value.rif_prefix.trim() : undefined;
    const rif_number = value.rif_number ? value.rif_number.trim() : undefined;
    const address = value.address ? value.address.trim() : undefined;

    return {
      ...value,
      name,
      rif_prefix,
      rif_number,
      address,
    };
  }
}
