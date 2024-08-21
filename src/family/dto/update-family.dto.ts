import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUrl, ValidateIf } from 'class-validator';

import { CreateFamilyDto } from './create-family.dto';

export class UpdateFamilyDto extends PartialType(CreateFamilyDto) {
  @ValidateIf((object, value) => value !== null)
  @IsOptional()
  @IsUrl()
  imageUrl?: string | null;
}
