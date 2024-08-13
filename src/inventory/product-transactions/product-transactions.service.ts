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
import { AllUserData } from '../../common/interfaces';
import {
  ProductTransactionType,
  TransactionFuctionParams,
} from '../interfaces';

import { ErrorHandleProvider, ResMessages } from '../../common/providers';
import { ProductEquivalencesService } from '../product-equivalences/product-equivalences.service';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ProductTransactionsService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    private readonly productsService: ProductsService,
    private readonly productEquivalencesService: ProductEquivalencesService,

    @InjectRepository(ProductTransaction)
    private readonly productTransactionRepository: Repository<ProductTransaction>,
  ) {}

  // ************************************************************
  //                    transacciones
  // ************************************************************

  async createTransaction(
    productId: string,
    createProductTransactionDto: CreateProductTransactionDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const { type } = createProductTransactionDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const product = await this.productsService.findById(productId);

    if (product.familyId != userFamily.id)
      throw new ForbiddenException(this.resMessages.UserForbiddenToFamily);

    try {
      let transaction = null;

      const params: TransactionFuctionParams = {
        createById: user.id,
        product,
        createProductTransactionDto,
        queryRunner,
      };

      // realizar operacion segun el tipo de transaccion
      if (type == ProductTransactionType.add)
        transaction = await this.createTransaction_add_by_queryRunner(params);

      if (type == ProductTransactionType.subtract)
        transaction =
          await this.createTransaction_sustract_by_queryRunner(params);

      if (type == ProductTransactionType.unpacking)
        transaction =
          await this.createTransaction_unpacking_by_queryRunner(params);

      if (!transaction)
        throw new BadRequestException(this.resMessages.transactionFailed);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return transaction as ProductTransaction;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async createTransaction_add_by_queryRunner(
    transactionFuctionParams: TransactionFuctionParams,
  ): Promise<ProductTransaction> {
    const { createById, product, createProductTransactionDto, queryRunner } =
      transactionFuctionParams;

    const { currentQuantity } = product;
    const { quantity } = createProductTransactionDto;

    const data = {
      ...createProductTransactionDto,
      productId: product.id,
      createById,
      type: ProductTransactionType.add,
      remainder: quantity,
    };

    const transaction = this.productTransactionRepository.create(data);
    await queryRunner.manager.save(transaction);

    product.currentQuantity = currentQuantity + quantity;

    await queryRunner.manager.save(product);

    await this.productEquivalencesService.calculateRelativeQuantity_by_queryRunner(
      product.id,
      queryRunner,
    );

    return transaction;
  }
  // sustract

  async createTransaction_sustract_by_queryRunner(
    transactionFuctionParams: TransactionFuctionParams,
  ): Promise<ProductTransaction> {
    const { createById, product, createProductTransactionDto, queryRunner } =
      transactionFuctionParams;

    const { currentQuantity } = product;
    const { quantity, transactionRefId } = createProductTransactionDto;

    const data = {
      ...createProductTransactionDto,
      productId: product.id,
      createById,
      type: ProductTransactionType.subtract,
    };

    const transactionRef = await this.getTransaction_By_Id(transactionRefId);

    if (currentQuantity < quantity)
      throw new BadRequestException(this.resMessages.NotHaveStock);

    if (transactionRef.remainder < quantity)
      throw new BadRequestException(this.resMessages.transactionNotHaveStock);

    transactionRef.remainder -= quantity;
    product.currentQuantity -= quantity;

    const newTransactionSubtract =
      this.productTransactionRepository.create(data);

    await queryRunner.manager.save([
      transactionRef,
      newTransactionSubtract,
      product,
    ]);

    await this.productEquivalencesService.calculateRelativeQuantity_by_queryRunner(
      product.id,
      queryRunner,
    );

    return newTransactionSubtract;
  }

  async createTransaction_unpacking_by_queryRunner(
    transactionFuctionParams: TransactionFuctionParams,
  ): Promise<ProductTransaction> {
    const { createById, product, createProductTransactionDto, queryRunner } =
      transactionFuctionParams;
    const { currentQuantity } = product;
    const { quantity, transactionRefId } = createProductTransactionDto;

    const dataUnpacking = {
      ...createProductTransactionDto,
      productId: product.id,
      createById,
      type: ProductTransactionType.unpacking,
    };

    const chiltProduct = await this.productsService.find_By_whereImFromOfTo(
      product.id,
    );

    const { equal } = chiltProduct.productEq_To;

    const transactionRef = await this.getTransaction_By_Id(transactionRefId);

    if (currentQuantity < quantity)
      throw new BadRequestException(this.resMessages.NotHaveStock);

    if (transactionRef.remainder < quantity)
      throw new BadRequestException(this.resMessages.transactionNotHaveStock);

    transactionRef.remainder -= quantity;
    product.currentQuantity -= quantity;

    const chilQuantity = quantity * equal;
    chiltProduct.currentQuantity += chilQuantity;

    const newTransactionUnpacking =
      this.productTransactionRepository.create(dataUnpacking);

    await queryRunner.manager.save([
      transactionRef,
      product,
      chiltProduct,
      newTransactionUnpacking,
    ]);

    const dataRestock = {
      quantity: chilQuantity,
      transactionRefId: newTransactionUnpacking.id,
      productId: chiltProduct.id,
      createById,
      type: ProductTransactionType.restock,
    };

    const newTransactionRestock =
      this.productTransactionRepository.create(dataRestock);

    await queryRunner.manager.save(newTransactionRestock);

    await this.productEquivalencesService.calculateRelativeQuantity_by_queryRunner(
      product.id,
      queryRunner,
    );

    return newTransactionUnpacking;
  }

  async getTransaction_By_Id(transactionId: string) {
    const transaction = this.productTransactionRepository.findOneBy({
      id: transactionId,
    });

    if (!transaction)
      throw new NotFoundException(this.resMessages.TransactionNotFound);

    return transaction;
  }

  async getTransactions(
    queryTransactionDto: QueryTransactionDto,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const { limit = 10, offset = 0, type } = queryTransactionDto;

    const transactions = await this.productTransactionRepository
      .createQueryBuilder('tr')
      .innerJoinAndSelect('tr.product', 'product')
      .where('product.familyId=:familyId', {
        familyId: userFamily.id,
      })
      .andWhere(
        new Brackets((qb) => {
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

    // await this.getProduct(productId, { userFamily });
    // const transaction = this.productTransactionRepository.find({
    //   where: { productId: productId },
    //   order: { createAt: 'ASC' },
    // });
    // return transaction;
  }

  // async deleteTransaction(
  //   transactionId: string,
  //   { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  // ) {}
}
