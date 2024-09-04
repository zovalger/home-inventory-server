import { IsOptional, IsString, MinLength } from 'class-validator';

export class CreateCompanyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name: string;

  // @IsOptional()
  // @IsUrl()
  // imageUrl: string;

  @IsOptional()
  @IsString()
  rif_prefix: string;

  @IsOptional()
  @IsString()
  rif_number: string;

  @IsOptional()
  @IsString()
  address: string;
}
