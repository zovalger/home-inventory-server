import {
  BadRequestException,
  ForbiddenException,
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
  TransactionFuctionParams,
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

  async getProduct(
    id: string,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const product = await this.findById(id);

    if (product.familyId != userFamily.id)
      throw new ForbiddenException(ResMessages.UserForbiddenToFamily);

    return product;
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
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
    { userFamily }: Pick<AllUserData, 'userFamily'>,
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
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const { fromId, equal } = createProductEquivalenceDto;

    // todo: ver si los productos existen buscar productos
    const products = await this.findByIds([fromId, productId]);

    if (products.length < 2)
      throw new NotFoundException(ResMessages.productsNotFound);

    const from = products.find((p) => p.id == fromId);
    const to = products.find((p) => p.id == productId);

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

      await this.calculateRelativeQuantity_by_queryRunner(fromId, queryRunner);

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
      .innerJoinAndSelect('eq.from', 'from_product')
      .where('from_product."familyId"=:familyId', { familyId })
      .andWhere('eq."fromId"=:productId OR eq."toId"=:productId', { productId })
      .getMany();
  }

  async updateEquivalence(
    eqId: string,
    updateProductEquivalenceDto: UpdateProductEquivalenceDto,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
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
    if (fromId) {
      eq.fromId = fromId;
      delete eq.from;
    }

    try {
      await this.validateEquivalenceLevel(fromId, eq.toId);

      await queryRunner.manager.save(eq);

      console.log(eq);

      await this.calculateRelativeQuantity_by_queryRunner(fromId, queryRunner);

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
    { userFamily }: Pick<AllUserData, 'userFamily'>,
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

      await this.calculateRelativeQuantity_by_queryRunner(to.id, queryRunner);

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
    // from > to > other
    // other > from > to
    ////  from > to > from
    ////  to > from > to
    ////  x > x > x > x

    const fromParent = await this.productEquivalenceRepository.findOneBy({
      toId: fromId,
    });
    const toChild = await this.productEquivalenceRepository.findOneBy({
      fromId: toId,
    });

    if (fromParent && toChild)
      throw new BadRequestException(
        ResMessages.productsHasManyLevelsEquivalences,
      );

    if (fromParent && fromParent.fromId == toId)
      throw new BadRequestException(
        ResMessages.productsHasCircularEquivalences,
      );

    if (toChild && toChild.toId == fromId)
      throw new BadRequestException(
        ResMessages.productsHasCircularEquivalences,
      );
  }

  calculateRelativeQuantity(
    parent: boolean,
    [p1, p2, p3]: {
      product: Product;
      equal: number;
    }[],
  ) {
    if (!parent) p1.product.relativeQuantity = 0;

    const sum1 = p1.product.relativeQuantity + p1.product.currentQuantity;
    p2.product.relativeQuantity = sum1 * p1.equal;

    const toSave = [p1.product, p2.product];

    if (p3.product) {
      const sum2 = p2.product.currentQuantity + p2.product.relativeQuantity;
      p3.product.relativeQuantity = sum2 * p2.equal;

      toSave.push(p3.product);
    }

    return toSave;
  }

  async calculateRelativeQuantity_by_queryRunner(
    productId: string,
    queryRunner: QueryRunner,
  ) {
    const eq = await queryRunner.manager.findOne(ProductEquivalence, {
      where: { fromId: productId },
      relations: { from: true, to: { productEq_From: { to: true } } },
    });

    if (!eq) throw new NotFoundException('no equivalencia');

    const parent = await queryRunner.manager.findOne(ProductEquivalence, {
      where: [{ toId: productId }],
    });

    const { from, to, equal } = eq;

    const toSave = this.calculateRelativeQuantity(!!parent, [
      { product: from, equal },
      { product: to, equal: to.productEq_From?.equal },
      { product: to.productEq_From?.to, equal: null },
    ]);

    await queryRunner.manager.save(toSave);
  }

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

    const product = await this.findById(productId);

    if (product.familyId != userFamily.id)
      throw new ForbiddenException(ResMessages.UserForbiddenToFamily);

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
        throw new BadRequestException(ResMessages.transactionFailed);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return transaction as ProductTransaction;
    } catch (error) {
      await queryRunner.commitTransaction();
      await queryRunner.release();

      this.handleDBError(error);
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

    await this.calculateRelativeQuantity_by_queryRunner(
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
      throw new BadRequestException(ResMessages.NotHaveStock);

    if (transactionRef.remainder < quantity)
      throw new BadRequestException(ResMessages.transactionNotHaveStock);

    transactionRef.remainder -= quantity;
    product.currentQuantity -= quantity;

    const newTransactionSubtract =
      this.productTransactionRepository.create(data);

    await queryRunner.manager.save([
      transactionRef,
      newTransactionSubtract,
      product,
    ]);

    await this.calculateRelativeQuantity_by_queryRunner(
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

    const chiltProduct = await this.productRepository.findOneBy({
      productEq_To: { fromId: product.id },
    });

    if (!chiltProduct)
      throw new NotFoundException(ResMessages.productsNotFound);

    const {
      productEq_To: { equal },
    } = chiltProduct;

    const transactionRef = await this.getTransaction_By_Id(transactionRefId);

    if (currentQuantity < quantity)
      throw new BadRequestException(ResMessages.NotHaveStock);

    if (transactionRef.remainder < quantity)
      throw new BadRequestException(ResMessages.transactionNotHaveStock);

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

    await this.calculateRelativeQuantity_by_queryRunner(
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
      throw new NotFoundException(ResMessages.TransactionNotFound);

    return transaction;
  }

  handleDBError(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('Is already register');

    if (error.status == 404) throw new NotFoundException(error.response);
    if (error.status == 400) throw new BadRequestException(error.response);

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
