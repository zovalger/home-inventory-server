import { IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { StatusObject } from 'src/common/interfaces';

export class QueryCompanyLocationDto extends PaginationDto {
  @IsOptional()
  @IsUUID()
  companyId?: string;

  @IsOptional()
  @IsString()
  status?: StatusObject;

  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
