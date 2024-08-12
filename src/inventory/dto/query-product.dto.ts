import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';

import { ProductStatus } from '../interfaces';
import { PaginationDto } from '../../common/dto/pagination.dto';

export class QueryProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  @MinLength(1)
  name?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  @MinLength(1)
  brand?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  @MinLength(1)
  model?: string;

  @IsOptional()
  @IsString()
  @IsIn(Object.values(ProductStatus))
  status?: ProductStatus;

  @IsOptional()
  @Transform(({ value }) => !!value)
  @IsBoolean()
  lowStock?: boolean;
}
