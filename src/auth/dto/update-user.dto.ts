import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUrl, ValidateIf } from 'class-validator';

import { CreateUserDto } from './create-user.dto';
import { Transform } from 'class-transformer';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ValidateIf((object, value) => value !== null)
  @IsOptional()
  @Transform(({ value }) => value.trim())
  @IsUrl()
  imageUrl?: string;
}
