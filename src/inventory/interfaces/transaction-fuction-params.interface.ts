import { QueryRunner } from 'typeorm';

import { CreateProductTransactionDto } from '../dto';
import { ProductTransaction } from '../entities';

export interface TransactionFuctionParams {
  createProductTransactionDto: CreateProductTransactionDto;
  createById: string;
  queryRunner: QueryRunner;
}

export interface DeleteTransactionFuctionParams {
  transaction: ProductTransaction;
  createById: string;
  queryRunner: QueryRunner;
}
