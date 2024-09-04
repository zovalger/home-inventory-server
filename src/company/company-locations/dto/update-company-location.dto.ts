import { PartialType } from '@nestjs/mapped-types';
import { CreateCompanyLocationDto } from './create-company-location.dto';

export class UpdateCompanyLocationDto extends PartialType(
  CreateCompanyLocationDto,
) {}
