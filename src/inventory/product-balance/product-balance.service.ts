import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ProductBalance } from '../entities';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { ErrorHandleProvider, ResMessages } from 'src/common/providers';

interface Search {
  productId: string;
  companyLocationId: string;
}

interface Options {
  queryRunner: QueryRunner;
}

@Injectable()
export class ProductBalanceService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    @InjectRepository(ProductBalance)
    private readonly productBalance: Repository<ProductBalance>,
  ) {}

  create(search: Search, options: Options): Promise<ProductBalance> {}

  find(search: Search): Promise<ProductBalance> {}

  findById(balanceId: string): Promise<ProductBalance> {}

  add(
    quantity: number,
    search: Search,
    options: Options,
  ): Promise<ProductBalance> {


    // todo: calcular las cuentas relativas


    await this.productEquivalencesService.calculateRelativeQuantity_by_queryRunner(
      product.id,
      queryRunner,
    );

    if (currentQuantity < quantity)
      throw new BadRequestException(this.resMessages.NotHaveStock);


  }

  subtract(
    quantity: number,
    search: Search,
    options: Options,
  ): Promise<ProductBalance> {}
}
