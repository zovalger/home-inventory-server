import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';

import { Product } from '../entities';

import { AllUserData } from '../../common/interfaces';
import { ProductStatus } from '../interfaces';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from '../dto';
import { ErrorHandleProvider, ResMessages } from '../../common/providers';

@Injectable()
export class ProductsService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
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
        message: this.resMessages.productAlreadyExist,
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

      this.errorHandleProvider.handle(error);
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

    if (!product)
      throw new NotFoundException(this.resMessages.productsNotFound);

    return product;
  }

  async find_By_whereImFromOfTo(fromId: string) {
    const product = await this.productRepository.findOneBy({
      productEq_To: { fromId: fromId },
    });

    if (!product)
      throw new NotFoundException(this.resMessages.productsNotFound);

    return product;
  }

  async getProduct(
    id: string,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const product = await this.findById(id);

    if (product.familyId != userFamily.id)
      throw new ForbiddenException(this.resMessages.UserForbiddenToFamily);

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
      throw new BadRequestException(this.resMessages.productAlreadyExist);

    const product = await this.productRepository.preload({
      id,
      ...updateProductDto,
    });

    // ver si es de la misma familia
    if (product.familyId != userFamily.id)
      throw new BadRequestException(this.resMessages.UserUnauthorizedToFamily);

    try {
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  async moveToTrash(
    id: string,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const product = await this.productRepository.findOneBy({ id });

    if (product.familyId != userFamily.id)
      throw new BadRequestException(this.resMessages.UserUnauthorizedToFamily);

    await this.productRepository.update(
      { id },
      { status: ProductStatus.delete },
    );

    return;
  }
}
