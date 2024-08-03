import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsUrl()
  imageUrl: string;
}
