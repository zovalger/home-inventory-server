import { PartialType } from '@nestjs/mapped-types';
import { IsOptional, IsUrl, ValidateIf } from 'class-validator';

import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @ValidateIf((object, value) => value !== null)
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
