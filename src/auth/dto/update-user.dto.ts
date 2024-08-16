import { OmitType, PartialType } from '@nestjs/mapped-types';
import { IsOptional, ValidateIf, IsUrl } from 'class-validator';
import { CreateUserDto } from './create-user.dto';

export class UpdateUserDto extends PartialType(
  OmitType(CreateUserDto, ['email']),
) {
  @ValidateIf((object, value) => value !== null)
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
