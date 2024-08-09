import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Or, QueryRunner, Repository } from 'typeorm';

import { AllUserData } from 'src/common/interfaces';
import { Product, ProductEquivalence, ProductTransaction } from './entities';
import {
  CreateProductDto,
  CreateProductEquivalenceDto,
  CreateProductTransactionDto,
  UpdateProductDto,
} from './dto';
import {
  ProductStatus,
  ProductTransactionType,
  SimpleAddTransaction,
} from './interfaces';
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
      throw new BadRequestException({
        message: ResMessages.productAlreadyExist,
        data: otherProduct,
      });

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
    const {
      limit = 10,
      offset = 0,
      name = '',
      brand = '',
      status = ProductStatus.active,
      lowStock,
    } = queryProductDto;

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.familyId=:familyId', { familyId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('UPPER(product.name) LIKE :name', {
            name: `%${name}%`,
          }).andWhere('product.status=:status', { status });

          if (brand)
            qb.andWhere('UPPER(product.brand) LIKE :brand', {
              brand: `%${brand}%`,
            });

          if (lowStock)
            qb.andWhere('product."currentQuantity"<=product."minQuantity"');
        }),
      )
      .orderBy({ name: 'ASC' })
      .take(limit)
      .skip(offset)
      .getMany();

    return products;
  }

  async findByIds(ids: string[]) {
    return await this.productRepository.findBy({ id: In(ids) });
  }

  // findOne(id: number) {
  //   return `This action returns a #${id} product`;
  // }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    // ver si es de la misma familia
    if (product.familyId != userFamily.id)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);

    try {
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async moveToTrash(
    id: string,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const product = await this.productRepository.findOneBy({ id });

    if (product.familyId != userFamily.id)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);

    await this.productRepository.update(
      { id },
      { status: ProductStatus.delete },
    );

    return;
  }

  // ************************************************************
  //                        equivalencias
  // ************************************************************

  async addEquivalence(
    createProductEquivalenceDto: CreateProductEquivalenceDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const { fromId, toId, equal } = createProductEquivalenceDto;

    // todo: ver si los productos existen buscar productos
    const products = await this.findByIds([fromId, toId]);

    if (products.length < 2)
      throw new NotFoundException(ResMessages.productsNotFound);

    const from = products.find((p) => (p.id = fromId));
    const to = products.find((p) => (p.id = toId));

    if (from.familyId != to.familyId)
      throw new BadRequestException(ResMessages.productsAreDifferentFamily);

    if (from.familyId != userFamily.id)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const equivalece = this.productEquivalenceRepository.create({
      fromId,
      toId,
      equal,
    });

    try {
      await this.validateEquivalenceLevel(fromId, toId);

      await queryRunner.manager.save(equivalece);

      // calcular la cuenta indirecta del hijo

      // sumar todos los padres mas los padres de los padres

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return equivalece;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async validateEquivalenceLevel(fromId: string, toId: string) {
    const relations = await this.productEquivalenceRepository.find({
      where: [{ fromId: toId }, { toId: fromId }],
    });

    if (relations.length >= 2)
      throw new BadRequestException(
        ResMessages.productsHasManyLevelsEquivalences,
      );
  }

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
