import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export class QueryProductDto extends PaginationDto {
  @IsOptional()
  @IsString()
  @Transform(({ value }) => value.trim().toUpperCase())
  @MinLength(1)
  name?: string;
}
