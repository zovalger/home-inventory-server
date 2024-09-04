import { Injectable, PipeTransform } from '@nestjs/common';
import { UpdateCompanyDto } from 'src/company/dto/update-company.dto';

@Injectable()
export class UpdateCompanyPipe implements PipeTransform {
  transform(value: UpdateCompanyDto) {
    const name = value.name ? value.name.trim() : undefined;

    // const imageUrl = value.imageUrl ? value.imageUrl : null;

    return {
      ...value,
      name,
      // imageUrl
    };
  }
}
