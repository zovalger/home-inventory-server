import { QueryRunner } from 'typeorm';
import { CreateProductTransactionDto } from '../dto';
import { Product } from '../entities';

export interface TransactionFuctionParams {
  createById: string;
  product: Product;
  createProductTransactionDto: CreateProductTransactionDto;
  queryRunner: QueryRunner;
}
