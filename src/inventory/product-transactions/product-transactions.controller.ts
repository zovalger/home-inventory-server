import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';

import { Family } from '../../family/entities';
import { User } from '../../auth/entities';

import { Auth, GetUser, GetUserFamily } from '../../auth/decorators';
import { CreateProductTransactionDto, QueryTransactionDto } from '../dto';

import { ProductTransactionsService } from './product-transactions.service';

@Controller()
export class ProductTransactionsController {
  constructor(
    private readonly productTransactionsService: ProductTransactionsService,
  ) {}

  @Get('transactions')
  @Auth()
  getTransactions(
    @Query() queryTransactionDto: QueryTransactionDto,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productTransactionsService.getTransactions(
      queryTransactionDto,
      {
        userFamily,
      },
    );
  }

  // ************************************************************
  //                        transaction
  // ************************************************************

  @Post(':productId/transactions')
  @Auth()
  createTransaction(
    @Param('productId') productId: string,
    @Body() createProductTransactionDto: CreateProductTransactionDto,
    @GetUser() user: User,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productTransactionsService.createTransaction(
      productId,
      createProductTransactionDto,
      {
        user,
        userFamily,
      },
    );
  }

  // @Get(':productId/transactions')
  // @Auth()
  // getProductTransactions(
  //   @Query() queryTransactionDto: QueryTransactionDto,
  //   @Param('productId') productId: string,
  //   @GetUserFamily() userFamily: Family,
  // ) {
  //   return this.productsService.getProductTransactions(productId, {
  //     userFamily,
  //   });
  // }

  // @Get(':productId/transactions/:transactionId')
  // @Auth()
  // getTransactionById(
  //   @Param('productId') productId: string,
  //   @Param('transactionId') transactionId: string,
  //   @GetUserFamily() userFamily: Family,
  // ) {
  //   return this.productsService.getTransaction_By_Id(transactionId);
  // }

  // @Delete('transactions/:transactionId')
  // @Auth()
  // deleteTransaction(
  //   @Param('transactionId') transactionId: string,
  //   @GetUser() user: User,
  //   @GetUserFamily() userFamily: Family,
  // ) {
  //   return this.productsService.deleteTransaction(transactionId, {
  //     user,
  //     userFamily,
  //   });
  // }
}
