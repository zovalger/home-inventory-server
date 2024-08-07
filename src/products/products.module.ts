import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { FamilyModule } from 'src/family/family.module';
import { AuthModule } from 'src/auth/auth.module';
import { Product, ProductEquivalence, ProductTransaction } from './entities';

@Module({
  imports: [
    AuthModule,
    FamilyModule,

    TypeOrmModule.forFeature([Product, ProductEquivalence, ProductTransaction]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService, TypeOrmModule],
})
export class ProductsModule {}
