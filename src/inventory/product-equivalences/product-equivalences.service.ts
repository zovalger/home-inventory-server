import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';

import { Product, ProductEquivalence } from '../entities';

import {
  CreateProductEquivalenceDto,
  UpdateProductEquivalenceDto,
} from '../dto';
import { AllUserData } from '../../common/interfaces';

import { ErrorHandleProvider, ResMessages } from '../../common/providers';
import { ProductsService } from '../products/products.service';

@Injectable()
export class ProductEquivalencesService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    private readonly productsService: ProductsService,

    @InjectRepository(ProductEquivalence)
    private readonly productEquivalenceRepository: Repository<ProductEquivalence>,
  ) {}

  async addEquivalence(
    productId: string,
    createProductEquivalenceDto: CreateProductEquivalenceDto,
    { userFamily }: Pick<AllUserData, 'userFamily'>,
  ) {
    const { fromId, equal } = createProductEquivalenceDto;

    // todo: ver si los productos existen buscar productos
    const products = await this.productsService.findByIds([fromId, productId]);

    if (products.length < 2)
      throw new NotFoundException(this.resMessages.productsNotFound);

    const from = products.find((p) => p.id == fromId);
    const to = products.find((p) => p.id == productId);

    if (from.familyId != to.familyId)
      throw new BadRequestException(
        this.resMessages.productsAreDifferentFamily,
      );

    if (from.familyId != userFamily.id)
      throw new BadRequestException(this.resMessages.userUnauthorizedToFamily);

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

      this.errorHandleProvider.handle(error);
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

    if (!eq) throw new NotFoundException(this.resMessages.notFound);

    const { familyId: eqFamilyId } = eq.from;

    if (eqFamilyId != userFamily.id)
      throw new BadRequestException(this.resMessages.userUnauthorizedToFamily);

    if (fromId) {
      const product = await this.productsService.findById(fromId);

      if (product.familyId != userFamily.id)
        throw new BadRequestException(
          this.resMessages.productsAreDifferentFamily,
        );
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

      this.errorHandleProvider.handle(error);
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

    if (!eq) throw new NotFoundException(this.resMessages.notFound);

    const { from, to } = eq;

    const { familyId } = from;

    if (familyId != userFamily.id)
      throw new BadRequestException(this.resMessages.userUnauthorizedToFamily);

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

      this.errorHandleProvider.handle(error);
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
        this.resMessages.productsHasManyLevelsEquivalences,
      );

    if (fromParent && fromParent.fromId == toId)
      throw new BadRequestException(
        this.resMessages.productsHasCircularEquivalences,
      );

    if (toChild && toChild.toId == fromId)
      throw new BadRequestException(
        this.resMessages.productsHasCircularEquivalences,
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

    if (!eq) return;

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
}
