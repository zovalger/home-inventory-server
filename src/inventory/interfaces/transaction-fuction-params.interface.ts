import { QueryRunner } from 'typeorm';

import { CreateProductTransactionDto } from '../dto';
import { Product, ProductTransaction } from '../entities';

export interface TransactionFuctionParams {
  createById: string;
  product: Product;
  createProductTransactionDto: CreateProductTransactionDto;
  queryRunner: QueryRunner;
}

export interface DeleteTransactionFuctionParams {
  transaction: ProductTransaction;
  product: Product;
  queryRunner: QueryRunner;
}
