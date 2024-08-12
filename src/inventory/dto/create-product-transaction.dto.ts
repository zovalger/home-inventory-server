import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

import { ProductTransactionType } from '../interfaces';

export class CreateProductTransactionDto {
  @IsString()
  @IsIn(
    Object.values(ProductTransactionType).filter(
      (t) => t != ProductTransactionType.restock,
    ),
  )
  type: ProductTransactionType; // add, subtract, unpacking

  @IsNumber()
  @IsPositive()
  quantity: number;

  // @IsOptional()
  // @IsNumber()
  // @IsPositive()
  // remainder: number;

  @IsOptional()
  @ValidateIf(({ type }) => type == ProductTransactionType.add)
  @Transform(({ value, obj: { type } }) =>
    type == ProductTransactionType.add ? value : null,
  )
  @IsDateString()
  expirationDate: string;

  @ValidateIf(({ type }) => type != ProductTransactionType.add)
  @Transform(({ value, obj: { type } }) =>
    type != ProductTransactionType.add ? value : null,
  )
  @IsUUID()
  transactionRefId: string;
}
