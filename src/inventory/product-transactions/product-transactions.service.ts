import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { ProductTransaction } from '../entities';

import { CreateProductTransactionDto, QueryTransactionDto } from '../dto';
import { AllUserData, UserOptions } from '../../common/interfaces';
import {
  DeleteTransactionFuctionParams,
  ProductTransactionType,
  TransactionFuctionParams,
} from '../interfaces';

import { ErrorHandleProvider, ResMessages } from '../../common/providers';
import { ProductEquivalencesService } from '../product-equivalences/product-equivalences.service';
// import { ProductsService } from '../products/products.service';
import { ProductBalanceService } from '../product-balance/product-balance.service';

@Injectable()
export class ProductTransactionsService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    // private readonly productsService: ProductsService,
    private readonly productEquivalencesService: ProductEquivalencesService,

    @InjectRepository(ProductTransaction)
    private readonly productTransactionRepository: Repository<ProductTransaction>,

    private readonly productBalanceService: ProductBalanceService,
  ) {}

  // ************************************************************
  //                    transacciones
  // ************************************************************

  async createTransaction(
    createProductTransactionDto: CreateProductTransactionDto,
    options: UserOptions,
  ) {
    const { user } = options;
    const { type } = createProductTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      let transactions = null;

      const params: TransactionFuctionParams = {
        createProductTransactionDto,
        createById: user.id,
        queryRunner,
      };

      // realizar operacion segun el tipo de transaccion
      if (type == ProductTransactionType.add)
        transactions = await this.createTransaction_add_by_queryRunner(params);

      if (type == ProductTransactionType.subtract)
        transactions =
          await this.createTransaction_sustract_by_queryRunner(params);

      if (type == ProductTransactionType.transfer_out)
        transactions =
          await this.createTransaction_transfer_by_queryRunner(params);

      // if (type == ProductTransactionType.unpacking)
      //   transactions =
      //     await this.createTransaction_unpacking_by_queryRunner(params);

      if (!transactions)
        throw new BadRequestException(this.resMessages.transactionFailed);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return transactions as ProductTransaction[];
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async createTransaction_add_by_queryRunner(
    transactionFuctionParams: TransactionFuctionParams,
  ): Promise<ProductTransaction[]> {
    const { createById, createProductTransactionDto, queryRunner } =
      transactionFuctionParams;

    const { quantity, expirationDate, productId, companyLocationId } =
      createProductTransactionDto;

    const balance = await this.productBalanceService.add(
      quantity,
      {
        companyLocationId,
        productId,
      },
      { queryRunner },
    );

    const transaction = this.productTransactionRepository.create({
      productBalanceId: balance.id,
      quantity,
      expirationDate,
      createById,
      type: ProductTransactionType.add,
      remainder: quantity,
    });

    await queryRunner.manager.save(transaction);

    return [transaction];
  }

  // sustract

  async createTransaction_sustract_by_queryRunner(
    transactionFuctionParams: TransactionFuctionParams,
  ): Promise<ProductTransaction[]> {
    const { createById, createProductTransactionDto, queryRunner } =
      transactionFuctionParams;

    const { quantity, transactionRefId, productId, companyLocationId } =
      createProductTransactionDto;

    const transactionRef = await this.getTransaction_By_Id(transactionRefId);

    if (transactionRef.remainder < quantity)
      throw new BadRequestException(this.resMessages.transactionNotHaveStock);

    if (
      transactionRef.type != ProductTransactionType.add &&
      transactionRef.type != ProductTransactionType.restock &&
      transactionRef.type != ProductTransactionType.transfer_in
    )
      throw new BadRequestException(this.resMessages.transactionRefInvalid);

    const balance = await this.productBalanceService.subtract(
      quantity,
      {
        companyLocationId,
        productId,
      },
      { queryRunner },
    );

    transactionRef.remainder -= quantity;

    await queryRunner.manager.save(transactionRef);

    const transaction = this.productTransactionRepository.create({
      productBalanceId: balance.id,
      type: ProductTransactionType.subtract,
      quantity,
      transactionRefId,
      createById,
    });

    await queryRunner.manager.save(transaction);

    return [transaction, transactionRef];
  }

  async createTransaction_transfer_by_queryRunner(
    transactionFuctionParams: TransactionFuctionParams,
  ): Promise<ProductTransaction[]> {
    const { createById, createProductTransactionDto, queryRunner } =
      transactionFuctionParams;

    const {
      quantity,
      transactionRefId,
      productId,
      companyLocationId,
      toCompanyLocationId,
    } = createProductTransactionDto;

    const transactionRef = await this.getTransaction_By_Id(transactionRefId);

    if (transactionRef.remainder < quantity)
      throw new BadRequestException(this.resMessages.transactionNotHaveStock);

    if (
      transactionRef.type != ProductTransactionType.add &&
      transactionRef.type != ProductTransactionType.restock &&
      transactionRef.type != ProductTransactionType.transfer_in
    )
      throw new BadRequestException(this.resMessages.transactionRefInvalid);

    const balance = await this.productBalanceService.subtract(
      quantity,
      {
        companyLocationId,
        productId,
      },
      { queryRunner },
    );

    transactionRef.remainder -= quantity;

    await queryRunner.manager.save(transactionRef);

    const transferOut = this.productTransactionRepository.create({
      productBalanceId: balance.id,
      type: ProductTransactionType.transfer_out,
      quantity,
      transactionRefId,
      createById,
    });

    await queryRunner.manager.save(transferOut);

    const otherBalance = await this.productBalanceService.add(
      quantity,
      {
        companyLocationId: toCompanyLocationId,
        productId,
      },
      { queryRunner },
    );

    const transferIn = this.productTransactionRepository.create({
      productBalanceId: otherBalance.id,
      type: ProductTransactionType.transfer_in,
      quantity,
      transactionRefId: transferOut.id,
      createById,
    });

    await queryRunner.manager.save(transferIn);

    return [transferOut, transferIn, transactionRef];
  }

  // todo: unpaking
  // async createTransaction_unpacking_by_queryRunner(
  //   transactionFuctionParams: TransactionFuctionParams,
  // ): Promise<ProductTransaction> {
  //   const { createById, createProductTransactionDto, queryRunner } =
  //     transactionFuctionParams;

  //   const { quantity, transactionRefId } = createProductTransactionDto;

  //   const transactionRef = await this.getTransaction_By_Id(transactionRefId);

  //   if (
  //     transactionRef.type != ProductTransactionType.add &&
  //     transactionRef.type != ProductTransactionType.restock
  //   )
  //     throw new BadRequestException(this.resMessages.transactionRefInvalid);

  //   // todo: balance del hijo

  //   const chiltProduct = await this.productsService.find_By_whereImFromOfTo(
  //     product.id,
  //   );

  //   const { equal } = chiltProduct.productEq_To;

  //   if (currentQuantity < quantity)
  //     throw new BadRequestException(this.resMessages.NotHaveStock);

  //   if (transactionRef.remainder < quantity)
  //     throw new BadRequestException(this.resMessages.transactionNotHaveStock);

  //   transactionRef.remainder -= quantity;
  //   product.currentQuantity -= quantity;

  //   const chilQuantity = quantity * equal;
  //   chiltProduct.currentQuantity += chilQuantity;

  //   const newTransactionUnpacking = this.productTransactionRepository.create({
  //     ...createProductTransactionDto,
  //     productId: product.id,
  //     createById,
  //     type: ProductTransactionType.unpacking,
  //   });

  //   await queryRunner.manager.save([
  //     transactionRef,
  //     product,
  //     chiltProduct,
  //     newTransactionUnpacking,
  //   ]);

  //   const dataRestock = {
  //     quantity: chilQuantity,
  //     remainder: chilQuantity,
  //     transactionRefId: newTransactionUnpacking.id,
  //     productId: chiltProduct.id,
  //     createById,
  //     type: ProductTransactionType.restock,
  //   };

  //   const newTransactionRestock =
  //     this.productTransactionRepository.create(dataRestock);

  //   await queryRunner.manager.save(newTransactionRestock);

  //   await this.productEquivalencesService.calculateRelativeQuantity_by_queryRunner(
  //     product.id,
  //     queryRunner,
  //   );

  //   return newTransactionUnpacking;
  // }

  async getTransaction_By_Id(id: string) {
    const transaction = this.productTransactionRepository.findOne({
      where: { id },
      // relations,
    });

    if (!transaction)
      throw new NotFoundException(this.resMessages.TransactionNotFound);

    return transaction;
  }

  async getTransactions(
    queryTransactionDto: QueryTransactionDto,
    options: UserOptions,
  ) {
    const {
      limit = 10,
      offset = 0,
      type,
      productId,
      companyId,
      companyLocationId,
    } = queryTransactionDto;

    const transactions = await this.productTransactionRepository
      .createQueryBuilder('tr')
      .innerJoinAndSelect('tr.product_balance', 'product_balance')
      .innerJoinAndSelect('product_balance.product', 'product')
      .where('product."companyId"=:companyId', {
        companyId,
      })
      .andWhere(
        new Brackets((qb) => {
          if (companyLocationId)
            qb.andWhere('tr."companyLocationId"=:companyLocationId', {
              companyLocationId,
            });

          if (productId)
            qb.andWhere('tr."productId"=:productId', {
              productId,
            });

          if (type)
            qb.andWhere('tr.type=:type', {
              type,
            });
        }),
      )
      .addOrderBy('tr.createAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();

    return transactions;
  }

  // todo: refactory

  async deleteTransaction(
    transactionId: string,
    {
      user,
      userFamily,
      userFamilyMember,
    }: Pick<AllUserData, 'user' | 'userFamily' | 'userFamilyMember'>,
  ) {
    const transaction = await this.getTransaction_By_Id(transactionId, {
      product: true,
    });

    const { product } = transaction;

    if (product.familyId != userFamily.id)
      throw new ForbiddenException(this.resMessages.userForbiddenToFamily);

    // si es el mismo usuario
    // si es admin o ouwner
    if (
      user.id != transaction.createById &&
      userFamilyMember.role != FamilyRoles.ouwner
    )
      throw new ForbiddenException(this.resMessages.userForbidden);

    // si no esta referenciada en otra transaccion

    const otherTransaction = await this.productTransactionRepository.findOne({
      where: { transactionRefId: transaction.id },
    });

    //
    if (
      otherTransaction &&
      otherTransaction.type != ProductTransactionType.restock
    )
      throw new ForbiddenException(this.resMessages.transactionHaveReferences);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const params: DeleteTransactionFuctionParams = {
        transaction,
        product,
        queryRunner,
      };

      // realizar operacion segun el tipo de transaccion
      if (transaction.type == ProductTransactionType.add)
        await this.delete_add_by_queryRunner(params);

      if (transaction.type == ProductTransactionType.subtract)
        await this.delete_subtract_by_queryRunner(params);

      if (transaction.type == ProductTransactionType.unpacking) {
        const restockOtherTransaction =
          await this.productTransactionRepository.findOne({
            where: { transactionRefId: otherTransaction.id },
          });

        if (restockOtherTransaction)
          throw new ForbiddenException(
            this.resMessages.transactionHaveReferences,
          );

        await this.delete_unpacking_by_queryRunner(params, otherTransaction);
      }

      // if (!transaction)
      //   throw new BadRequestException(this.resMessages.transactionFailed);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      // return transaction as ProductTransaction;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async delete_add_by_queryRunner(
    deleteTransactionFuctionParams: DeleteTransactionFuctionParams,
  ) {
    const { transaction, product, queryRunner } =
      deleteTransactionFuctionParams;

    product.currentQuantity -= transaction.quantity;

    await queryRunner.manager.save(product);

    await queryRunner.manager.delete(ProductTransaction, {
      id: transaction.id,
    });
  }

  async delete_subtract_by_queryRunner(
    deleteTransactionFuctionParams: DeleteTransactionFuctionParams,
  ) {
    const { transaction, product, queryRunner } =
      deleteTransactionFuctionParams;

    product.currentQuantity += transaction.quantity;

    await queryRunner.manager.update(
      ProductTransaction,
      { id: transaction.transactionRefId },
      { remainder: () => `remainder + ${transaction.quantity}` },
    );

    await queryRunner.manager.save(product);

    await queryRunner.manager.delete(ProductTransaction, {
      id: transaction.id,
    });
  }

  async delete_unpacking_by_queryRunner(
    deleteTransactionFuctionParams: DeleteTransactionFuctionParams,
    restockTransaction: ProductTransaction,
  ) {
    const { transaction, product, queryRunner } =
      deleteTransactionFuctionParams;

    if (restockTransaction)
      throw new NotFoundException(this.resMessages.TransactionNotFound);

    const restockProduct = await this.productsService.findById(
      restockTransaction.productId,
    );

    product.currentQuantity += transaction.quantity;
    restockProduct.currentQuantity -= restockTransaction.quantity;

    await queryRunner.manager.update(
      ProductTransaction,
      { id: transaction.transactionRefId },
      { remainder: () => `remainder + ${transaction.quantity}` },
    );

    await queryRunner.manager.save([product, restockProduct]);

    await queryRunner.manager.delete(ProductTransaction, {
      id: restockTransaction.id,
    });
    await queryRunner.manager.delete(ProductTransaction, {
      id: transaction.id,
    });
  }
}
