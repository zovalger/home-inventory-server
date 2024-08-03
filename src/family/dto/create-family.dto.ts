import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsUrl()
  image: string;
}
