import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { ProductTransactionType } from '../interfaces';

export class QueryTransactionDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @IsIn(Object.values(ProductTransactionType))
  type?: ProductTransactionType;
}
