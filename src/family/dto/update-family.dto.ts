import { PartialType } from '@nestjs/mapped-types';
import { CreateFamilyDto } from './create-family.dto';
import { IsOptional, IsUrl, ValidateIf } from 'class-validator';

export class UpdateFamilyDto extends PartialType(CreateFamilyDto) {
  @ValidateIf((object, value) => value !== null)
  @IsOptional()
  @IsUrl()
  imageUrl: string | null;
}
