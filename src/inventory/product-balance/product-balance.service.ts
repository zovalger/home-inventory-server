import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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
    private readonly productBalanceRepository: Repository<ProductBalance>,
  ) {}

  async create(search: Search): Promise<ProductBalance> {
    const balance = await this.productBalanceRepository.create({ ...search });

    await this.productBalanceRepository.save(balance);

    return balance;
  }

  async findOne(search: Search): Promise<ProductBalance> {
    return (
      (await this.productBalanceRepository.findOneBy(search)) ||
      (await this.create(search))
    );
  }

  async findById(id: string): Promise<ProductBalance> {
    const balance = await this.productBalanceRepository.findOneBy({ id });

    if (!balance) throw new NotFoundException();

    return balance;
  }

  async add(
    quantity: number,
    search: Search,
    options: Options,
  ): Promise<ProductBalance> {
    const { queryRunner } = options;

    const balance = await this.findOne(search);

    balance.quantity += quantity;

    await queryRunner.manager.save(balance);

    return balance;

    // todo: calcular las cuentas relativas
    // await this.productEquivalencesService.calculateRelativeQuantity_by_queryRunner(
    //   product.id,
    //   queryRunner,
    // );
  }

  async subtract(
    quantity: number,
    search: Search,
    options: Options,
  ): Promise<ProductBalance> {
    const { queryRunner } = options;

    const balance = await this.findOne(search);

    if (balance.quantity < quantity)
      throw new BadRequestException(this.resMessages.NotHaveStock);

    balance.quantity -= quantity;

    await queryRunner.manager.save(balance);

    return balance;
  }
}
