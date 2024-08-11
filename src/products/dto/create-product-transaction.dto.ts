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
import { ProductTransactionType } from '../interfaces';
import { Transform } from 'class-transformer';

export class CreateProductTransactionDto {
  @IsString()
  @IsIn(Object.values(ProductTransactionType))
  type: ProductTransactionType; // add, subtract, unpacking

  @IsNumber()
  @IsPositive()
  quantity: number;

  // @IsOptional()
  // @IsNumber()
  // @IsPositive()
  // remainder: number;

  @IsOptional()
  @Transform(({ value, obj: { type } }) =>
    type == ProductTransactionType.add ? value : null,
  )
  @ValidateIf(({ type }) => type == ProductTransactionType.add)
  @IsDateString()
  expirationDate: string;

  @ValidateIf(
    ({ type }) =>
      type == ProductTransactionType.subtract ||
      type == ProductTransactionType.restock,
  )
  @Transform(({ value, obj: { type } }) =>
    type != ProductTransactionType.add ? value : null,
  )
  @IsUUID()
  transactionRefId: string;
}
