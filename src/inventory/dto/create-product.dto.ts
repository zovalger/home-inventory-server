import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
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
  @MinLength(1)
  brand?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  model?: string;

  @IsNumber()
  @MinLength(1)
  cost: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  minQuantity?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  maxQuantity?: number;

  @IsString()
  @IsIn(Object.values(UnitOfMeasurement))
  unitOfMeasurement: UnitOfMeasurement;

  @IsBoolean()
  divisible: boolean;

  @IsUUID()
  companyId: string;

  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
