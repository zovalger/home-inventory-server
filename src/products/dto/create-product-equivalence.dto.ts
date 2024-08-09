import { IsNumber, IsPositive, IsUUID } from 'class-validator';

export class CreateProductEquivalenceDto {
  @IsNumber()
  @IsPositive()
  equal: number;

  @IsUUID()
  fromId: string;

  @IsUUID()
  toId: string;
}
