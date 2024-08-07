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

export class CreateProductDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsString()
  model?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  currentQuantity?: number;

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
