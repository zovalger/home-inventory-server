import { IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Transform } from 'class-transformer';

export class QueryCompanyDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  @MinLength(1)
  name?: string;
}
