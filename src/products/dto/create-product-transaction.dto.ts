import {
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { ProductTransactionType } from '../interfaces';

export class CreateProductTransactionDto {
  @IsString()
  @IsIn(Object.values(ProductTransactionType))
  type: ProductTransactionType; // add, subtract, unpacking

  @IsNumber()
  @IsPositive()
  quantity: number;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  remainder: number;

  @IsString()
  @IsDate()
  expirationDate: string;

  @IsUUID()
  productId: string;

  @IsOptional()
  @IsUUID()
  transactionToSustractId: string;

  @IsUUID()
  createById: string;
}
