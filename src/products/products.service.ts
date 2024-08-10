import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, QueryRunner, Repository } from 'typeorm';

import { AllUserData } from 'src/common/interfaces';
import { Product, ProductEquivalence, ProductTransaction } from './entities';
import {
  CreateProductDto,
  CreateProductEquivalenceDto,
  CreateProductTransactionDto,
  UpdateProductDto,
  UpdateProductEquivalenceDto,
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
    const { name, brand, model } = createProductDto;

    const { id: createById } = user;
    const { id: familyId } = userFamily;

    const otherProduct = await this.productRepository
      .createQueryBuilder()
      .where('"familyId"=:familyId', {
        familyId,
      })
      .andWhere('UPPER(name)=:name', { name: name.toUpperCase() })
      .andWhere(brand ? 'UPPER(brand)=:brand' : 'brand IS NULL', {
        brand: brand && brand.toUpperCase(),
      })
      .andWhere(model ? 'UPPER(model)=:model' : 'model IS NULL', {
        model: model && model.toUpperCase(),
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
      model = '',
      status = ProductStatus.active,
      lowStock,
    } = queryProductDto;

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product.familyId=:familyId', { familyId })
      .andWhere(
        new Brackets((qb) => {
          qb.where('UPPER(product.name) LIKE :name', {
            name: `%${name.toUpperCase()}%`,
          }).andWhere('product.status=:status', { status });

          if (brand)
            qb.andWhere('UPPER(product.brand) LIKE :brand', {
              brand: `%${brand.toUpperCase()}%`,
            });

          if (model)
            qb.andWhere('UPPER(product.model) LIKE :model', {
              model: `%${model.toUpperCase()}%`,
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

  async findById(id: string) {
    const product = await this.productRepository.findOneBy({ id });

    if (!product) throw new NotFoundException(ResMessages.productsNotFound);

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const { name, brand, model } = updateProductDto;

    const [otherProduct] = await this.findAll(userFamily.id, {
      name,
      brand,
      model,
    });

    if (otherProduct)
      throw new BadRequestException(ResMessages.productAlreadyExist);

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
    productId: string,
    createProductEquivalenceDto: CreateProductEquivalenceDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const { fromId, equal } = createProductEquivalenceDto;

    // todo: ver si los productos existen buscar productos
    const products = await this.findByIds([fromId, productId]);

    if (products.length < 2)
      throw new NotFoundException(ResMessages.productsNotFound);

    const from = products.find((p) => (p.id = fromId));
    const to = products.find((p) => (p.id = productId));

    if (from.familyId != to.familyId)
      throw new BadRequestException(ResMessages.productsAreDifferentFamily);

    if (from.familyId != userFamily.id)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const equivalece = this.productEquivalenceRepository.create({
      fromId,
      toId: productId,
      equal,
    });

    try {
      await this.validateEquivalenceLevel(fromId, productId);

      await queryRunner.manager.save(equivalece);

      await this.calculateRelativeQuantity(fromId);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return equivalece;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async getEquivalences({ userFamily }: Pick<AllUserData, 'userFamily'>) {
    const { id: familyId } = userFamily;

    return await this.productEquivalenceRepository.find({
      where: { from: { familyId } },
    });
  }

  async getProductEquivalences(
    productId: string,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const { id: familyId } = userFamily;

    return await this.productEquivalenceRepository
      .createQueryBuilder('eq')
      .where({ from: { familyId } })
      .andWhere(
        new Brackets((qb) => {
          qb.where('eq."fromId"=:fromId', { fromId: productId }).orWhere(
            'eq."fromId"=:fromId',
            { toId: productId },
          );
        }),
      );
  }

  async updateEquivalence(
    eqId: string,
    updateProductEquivalenceDto: UpdateProductEquivalenceDto,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const { fromId, equal } = updateProductEquivalenceDto;

    if (!fromId && !equal) throw new BadRequestException();

    const eq = await this.productEquivalenceRepository.findOne({
      where: { id: eqId },
      relations: { from: true },
    });

    if (!eq) throw new NotFoundException(ResMessages.NotFound);

    const { familyId: eqFamilyId } = eq.from;

    if (eqFamilyId != userFamily.id)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);

    if (fromId) {
      const product = await this.findById(fromId);

      if (product.familyId != userFamily.id)
        throw new BadRequestException(ResMessages.productsAreDifferentFamily);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    if (equal) eq.equal = equal;
    if (fromId) eq.fromId = fromId;

    try {
      await this.validateEquivalenceLevel(fromId, eq.toId);

      await queryRunner.manager.save(eq);

      await this.calculateRelativeQuantity(fromId);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return eq;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async deleteEquivalence(
    eqId: string,
    { user, userFamily }: Pick<AllUserData, 'user' | 'userFamily'>,
  ) {
    const eq = await this.productEquivalenceRepository.findOne({
      where: { id: eqId },
      relations: { from: true, to: true },
    });

    if (!eq) throw new NotFoundException(ResMessages.NotFound);

    const { from, to } = eq;

    const { familyId } = from;

    if (familyId != userFamily.id)
      throw new BadRequestException(ResMessages.UserUnauthorizedToFamily);

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.delete(ProductEquivalence, { id: eq.id });

      await this.calculateRelativeQuantity(from.id);
      await this.calculateRelativeQuantity(to.id);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return eq;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async validateEquivalenceLevel(fromId: string, toId: string) {
    const childRelations = await this.productEquivalenceRepository.find({
      where: [
        // que el from no tenga otro hijo
        { fromId },
        // que el to no tenga otro padre
        { toId },
      ],
    });

    if (childRelations.length)
      throw new BadRequestException(
        ResMessages.productsHasManyLevelsEquivalences,
      );

    const parentRelations = await this.productEquivalenceRepository.find({
      where: [
        // donde el padre sea to
        { fromId: toId },
        // donde el hijo sea from
        { toId: fromId },
      ],
    });

    if (parentRelations.length >= 2)
      throw new BadRequestException(
        ResMessages.productsHasManyLevelsEquivalences,
      );

    const { fromId: fromIdOther, toId: toIdOther } = parentRelations[0];

    if (fromIdOther == toId || toIdOther == fromId)
      throw new BadRequestException(
        ResMessages.productsHasManyLevelsEquivalences,
      );
  }

  async calculateRelativeQuantity(productId: string) {
    const eq = await this.productEquivalenceRepository.findOne({
      where: [{ fromId: productId }],
      relations: { from: true, to: { productEq_From: { to: true } } },
    });

    if (!eq) return;

    const parent = await this.productEquivalenceRepository.findOne({
      where: [{ toId: productId }],
    });

    const { from, to, equal } = eq;

    const product1 = from;
    const product2 = to;

    if (!parent) product1.relativeQuantity = 0;

    const sum1 = product1.relativeQuantity + product1.currentQuantity;
    product2.relativeQuantity = sum1 * equal;

    const toSave = [product1, product2];

    if (product2.productEq_From) {
      const { to: product3, equal: equal2 } = to.productEq_From;

      const sum2 = product2.currentQuantity + product2.relativeQuantity;
      product3.currentQuantity = sum2 * equal2;

      toSave.push(product3);
    }

    await this.productRepository.save(toSave);
  }

  // ************************************************************
  //                    transacciones
  // ************************************************************

  // async createTransaction(){

  // }

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
