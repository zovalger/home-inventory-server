import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { Family, FamilyMember } from '../../family/entities';
import { User } from '../../auth/entities';

import { Auth, GetUser } from '../../auth/decorators';
import { CreateProductTransactionDto, QueryTransactionDto } from '../dto';

import { ProductTransactionsService } from './product-transactions.service';
import { GetUserFamily, GetUserFamilyMember } from '../../family/decorators';

@Controller('inventory/transactions')
export class ProductTransactionsController {
  constructor(
    private readonly productTransactionsService: ProductTransactionsService,
  ) {}

  @Post(':productId')
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

  @Get()
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

  // @Get(':productId/transactions/:transactionId')
  // @Auth()
  // getTransactionById(
  //   @Param('productId') productId: string,
  //   @Param('transactionId') transactionId: string,
  //   @GetUserFamily() userFamily: Family,
  // ) {
  //   return this.productsService.getTransaction_By_Id(transactionId);
  // }

  @Delete('id/:transactionId')
  @Auth()
  deleteTransaction(
    @Param('transactionId') transactionId: string,
    @GetUser() user: User,
    @GetUserFamily() userFamily: Family,
    @GetUserFamilyMember() userFamilyMember: FamilyMember,
  ) {
    return this.productTransactionsService.deleteTransaction(transactionId, {
      user,
      userFamily,
      userFamilyMember,
    });
  }
}
