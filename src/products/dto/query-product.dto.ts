import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ProductStatus } from '../interfaces';

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
  @IsIn(Object.values(ProductStatus))
  status?: ProductStatus;

  @IsOptional()
  @IsBoolean()
  lowStock?: boolean;
}
