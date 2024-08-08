import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';

import { AllUserData } from 'src/common/interfaces';
import { Product, ProductEquivalence, ProductTransaction } from './entities';
import {
  CreateProductDto,
  CreateProductTransactionDto,
  UpdateProductDto,
} from './dto';
import { ProductTransactionType, SimpleAddTransaction } from './interfaces';
import { ResMessages } from 'src/common/res-messages/res-messages';
import { QueryProductDto } from './dto/query-product.dto';
import { FamilyService } from 'src/family/family.service';

@Injectable()
export class ProductsService {
  constructor(
    private readonly familyService: FamilyService,

    private readonly dataSource: DataSource,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(ProductEquivalence)
    private readonly productEquivalenceRepository: Repository<ProductEquivalence>,

    @InjectRepository(ProductTransaction)
    private readonly productTransactionRepository: Repository<ProductTransaction>,
  ) {}

  async create(
    createProductDto: CreateProductDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    // const { currentQuantity, ...productData } = createProductDto;
    const { id: createById } = user;
    const { id: familyId } = userFamily;

    const otherProduct = await this.productRepository
      .createQueryBuilder()
      .where('UPPER(name)=:name AND "familyId"=:familyId', {
        name: createProductDto.name.toUpperCase(),
        familyId,
      })
      .getOne();

    if (otherProduct)
      throw new BadRequestException(ResMessages.productAlreadyExist);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const product = this.productRepository.create({
      ...createProductDto,
      createById,
      familyId,
    });
    try {
      await queryRunner.manager.save(product);

      // if (currentQuantity)
      //   await this.createTransaction_add_by_queryRunner(
      //     {
      //       quantity: currentQuantity,
      //       productId: product.id,
      //       createById: user.id,
      //     },
      //     queryRunner,
      //   );

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return product;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async findAll(familyId: string, queryProductDto: QueryProductDto) {
    const { limit = 10, offset = 0, name = '' } = queryProductDto;

    console.log(name);

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.familyId=:familyId', { familyId })
      .andWhere('UPPER(product.name) LIKE :name', { name: `%${name}%` })
      .orderBy({ name: 'ASC' })
      .take(limit)
      .skip(offset)
      .getMany();

    return products;
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} product`;
  // }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    { user }: Pick<AllUserData, 'user'>,
  ) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    const isMember = !(await this.familyService.isMemberOfThisFamily(
      user.id,
      product.familyId,
    ));
    if (!isMember)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);
    // ver si es de la misma familia

    try {
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  // remove(id: number) {
  //   return `This action removes a #${id} product`;
  // }

  // ************************************************************
  //                    transacciones
  // ************************************************************

  async createTransaction_by_queryRunner(
    createProductTransactionDto: CreateProductTransactionDto,
    queryRunner: QueryRunner,
  ) {
    const transaction = this.productTransactionRepository.create(
      createProductTransactionDto,
    );

    await queryRunner.manager.save(transaction);

    return transaction;
  }

  async createTransaction_add_by_queryRunner(
    { quantity, productId, createById }: SimpleAddTransaction,
    queryRunner: QueryRunner,
  ) {
    return await this.createTransaction_by_queryRunner(
      {
        type: ProductTransactionType.add,
        quantity: quantity,
        remainder: quantity,
        productId,
        createById,
        expirationDate: null,
        transactionToSustractId: null,
      },
      queryRunner,
    );
  }

  handleDBError(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('Is already register');

    if (error.status == 404) throw new NotFoundException(error.response);

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
