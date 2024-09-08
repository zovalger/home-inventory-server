import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

import { StatusObject } from 'src/common/interfaces';

export class QueryCompanyDto extends PaginationDto {
  @IsOptional()
  @IsString()
  // @Transform(({ value }) => value.trim().toUpperCase())
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsUUID()
  createById?: string;

  @IsOptional()
  @IsString()
  status?: StatusObject;
}
