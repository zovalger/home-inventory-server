import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import {
  Product,
  ProductBalance,
  ProductEquivalence,
  ProductTransaction,
} from './entities';

import { AuthModule } from '../auth/auth.module';
import { CommonModule } from '../common/common.module';

import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { ProductEquivalencesService } from './product-equivalences/product-equivalences.service';
import { ProductEquivalencesController } from './product-equivalences/product-equivalences.controller';
import { ProductTransactionsService } from './product-transactions/product-transactions.service';
import { ProductTransactionsController } from './product-transactions/product-transactions.controller';
import { CompanyModule } from 'src/company/company.module';
import { ProductBalanceService } from './product-balance/product-balance.service';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    CompanyModule,

    TypeOrmModule.forFeature([
      Product,
      ProductBalance,
      ProductEquivalence,
      ProductTransaction,
    ]),
  ],
  controllers: [
    ProductsController,
    ProductEquivalencesController,
    ProductTransactionsController,
  ],
  providers: [
    ProductsService,
    ProductBalanceService,
    ProductEquivalencesService,
    ProductTransactionsService,
  ],
  exports: [
    TypeOrmModule,
    ProductsService,
    ProductEquivalencesService,
    ProductTransactionsService,
  ],
})
export class InventoryModule {}
