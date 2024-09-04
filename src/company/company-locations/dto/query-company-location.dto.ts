import { IsString } from 'class-validator';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class QueryCompanyLocationDto extends PaginationDto {
  @IsString()
  companyId: string;
}
