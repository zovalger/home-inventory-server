// import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsPositive, Min } from 'class-validator';

export class PaginationDto {
  // @ApiProperty({
  //   required: false,
  //   default: 10,
  //   description: 'how many rows do you need',
  // })
  // rules
  @IsOptional()
  @IsPositive()
  @Type(() => Number) //transformar
  limit?: number;

  // @ApiProperty({
  //   default: 0,
  //   description: 'how many rows do you want to skip',
  // })
  @IsOptional()
  @Min(0)
  @Type(() => Number)
  offset?: number;
}
