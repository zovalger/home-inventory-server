import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Min,
  MinLength,
} from 'class-validator';
import { UnitOfMeasurement } from '../interfaces';
import { Transform } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(1)
  brand?: string;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim())
  @MinLength(1)
  model?: string;

  // @IsOptional()
  // @IsNumber()
  // @Min(0)
  // currentQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @IsBoolean()
  divisible: boolean;

  @IsString()
  @IsIn(Object.values(UnitOfMeasurement))
  unitOfMeasurement: UnitOfMeasurement;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
