import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

export class CreateFamilyDto {
  @IsString()
  // @Transform(({ value }) => value.trim())
  @MinLength(1)
  name: string;

  @IsOptional()
  @IsUrl()
  imageUrl: string;
}
