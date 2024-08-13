import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product, ProductEquivalence, ProductTransaction } from './entities';

import { AuthModule } from '../auth/auth.module';
import { FamilyModule } from '../family/family.module';
import { CommonModule } from '../common/common.module';

import { ProductsService } from './products/products.service';
import { ProductsController } from './products/products.controller';
import { ProductEquivalencesService } from './product-equivalences/product-equivalences.service';
import { ProductEquivalencesController } from './product-equivalences/product-equivalences.controller';
import { ProductTransactionsService } from './product-transactions/product-transactions.service';
import { ProductTransactionsController } from './product-transactions/product-transactions.controller';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    FamilyModule,

    TypeOrmModule.forFeature([Product, ProductEquivalence, ProductTransaction]),
  ],
  controllers: [
    ProductsController,
    ProductEquivalencesController,
    ProductTransactionsController,
  ],
  providers: [
    ProductsService,
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
