import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, DataSource, In, Repository } from 'typeorm';

import { Product } from '../entities';

import { StatusObject } from '../../common/interfaces';
import { ProductStatus } from '../interfaces';
import { CreateProductDto, UpdateProductDto, QueryProductDto } from '../dto';
import { ErrorHandleProvider, ResMessages } from '../../common/providers';
import { User } from 'src/auth/entities';
import { CompanyService } from 'src/company/company.service';
import { isAdmin } from 'src/auth/helpers/is-admin';

interface options {
  user: User;
}

@Injectable()
export class ProductsService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly companyService: CompanyService,
  ) {}

  async create(createProductDto: CreateProductDto, options: options) {
    const { user } = options;
    const { name, brand, model, companyId } = createProductDto;

    const isOuwner = await this.companyService.isOuwnerOfCompany(
      companyId,
      user.id,
    );

    if (!isOuwner)
      throw new BadRequestException(this.resMessages.userForbidden);

    const otherProduct = await this.existProduct(companyId, {
      name,
      brand,
      model,
    });

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
      createById: user.id,
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

  async findAll(queryProductDto: QueryProductDto, options: options) {
    const { user } = options;
    const {
      limit = 10,
      offset = 0,
      name = '',
      brand = '',
      model = '',
      status = ProductStatus.active,
      companyId,
      // lowStock,
    } = queryProductDto;

    if (!(await this.companyService.isOuwnerOfCompany(companyId, user.id)))
      throw new ForbiddenException();

    const products = await this.productRepository
      .createQueryBuilder('product')
      .where('product."companyId"=:companyId', { companyId })
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

          // if (lowStock)
          //   qb.andWhere('product."currentQuantity"<=product."minQuantity"');
        }),
      )
      .orderBy({ name: 'ASC' })
      .take(limit)
      .skip(offset)
      .getMany();

    return products;
  }

  async findById(id: string, options: options) {
    options;

    const product = await this.productRepository.findOne({
      where: { id },
      relations: { balances: true },
    });

    if (!product)
      throw new NotFoundException(this.resMessages.productsNotFound);

    return product;
  }

  async findByIds(ids: string[]) {
    return await this.productRepository.findBy({ id: In(ids) });
  }

  async find_By_whereImFromOfTo(fromId: string) {
    const product = await this.productRepository.findOneBy({
      productEq_To: { fromId: fromId },
    });

    if (!product)
      throw new NotFoundException(this.resMessages.productsNotFound);

    return product;
  }

  async update(
    productId: string,
    updateProductDto: UpdateProductDto,
    options: options,
  ) {
    const { user } = options;
    const { name, brand, model } = updateProductDto;

    const product = await this.productRepository.preload({
      id: productId,
      ...updateProductDto,
    });

    if (!product)
      throw new NotFoundException(this.resMessages.productsNotFound);

    const isOuwner = await this.companyService.isOuwnerOfCompany(
      product.companyId,
      user.id,
    );

    if (!isOuwner) throw new ForbiddenException(this.resMessages.userForbidden);

    const existOtherProduct = await this.productRepository
      .createQueryBuilder()
      .where('"companyId"=:companyId', {
        companyId: product.companyId,
      })
      .andWhere('UPPER(name)=:name', { name: name.toUpperCase() })
      .andWhere(brand ? 'UPPER(brand)=:brand' : 'brand IS NULL', {
        brand: brand && brand.toUpperCase(),
      })
      .andWhere(model ? 'UPPER(model)=:model' : 'model IS NULL', {
        model: model && model.toUpperCase(),
      })
      .andWhere('id != :productId', { productId })
      .getExists();

    if (existOtherProduct)
      throw new BadRequestException(this.resMessages.productAlreadyExist);

    try {
      await this.productRepository.save(product);

      return product;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  async archive(id: string, options: options) {
    const { user } = options;

    const product = await this.productRepository.findOne({
      where: {
        id,
      },
      relations: { productEq_From: { to: true }, productEq_To: { from: true } },
      select: {
        id: true,
        companyId: true,
        name: true,
        productEq_From: { to: { id: true, name: true } },
        productEq_To: { from: { id: true, name: true } },
      },
    });

    if (
      !isAdmin(user) &&
      !(await this.companyService.isOuwnerOfCompany(product.companyId, user.id))
    )
      throw new ForbiddenException();

    if (!product)
      throw new NotFoundException(this.resMessages.productsNotFound);

    if (product.productEq_To || product.productEq_From)
      throw new BadRequestException(
        this.resMessages.productHasRelations([
          product.productEq_From?.to.name,
          product.productEq_To?.from.name,
        ]),
      );

    product.status = StatusObject.archive;

    await this.productRepository.save(product);

    return product;
  }

  async unarchive(id: string, options: options) {
    const { user } = options;

    const product = await this.productRepository.preload({
      id,
      status: StatusObject.active,
    });

    if (
      !isAdmin(user) &&
      !(await this.companyService.isOuwnerOfCompany(product.companyId, user.id))
    )
      throw new ForbiddenException();

    await this.productRepository.save(product);

    return product;
  }

  async existProduct(
    companyId: string,
    query: { name: string; brand?: string; model?: string },
  ) {
    const { name, brand, model } = query;

    return await this.productRepository
      .createQueryBuilder()
      .where('"companyId"=:companyId', {
        companyId,
      })
      .andWhere('UPPER(name)=:name', { name: name.toUpperCase() })
      .andWhere(brand ? 'UPPER(brand)=:brand' : 'brand IS NULL', {
        brand: brand && brand.toUpperCase(),
      })
      .andWhere(model ? 'UPPER(model)=:model' : 'model IS NULL', {
        model: model && model.toUpperCase(),
      })
      .getExists();
  }
}
