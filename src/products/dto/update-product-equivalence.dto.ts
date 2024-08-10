import { PartialType } from '@nestjs/mapped-types';
import { CreateProductEquivalenceDto } from './create-product-equivalence.dto';

export class UpdateProductEquivalenceDto extends PartialType(
  CreateProductEquivalenceDto,
) {}
