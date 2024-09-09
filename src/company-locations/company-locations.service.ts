import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Brackets, DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CompanyLocation } from './entities';
import {
  CreateCompanyLocationDto,
  QueryCompanyLocationDto,
  UpdateCompanyLocationDto,
} from './dto';
import { StatusObject } from 'src/common/interfaces';
import { isAdmin } from 'src/auth/helpers/is-admin';
import { User } from 'src/auth/entities';
import { CompanyService } from '../company/company.service';
import { ErrorHandleProvider, ResMessages } from 'src/common/providers';

interface options {
  user: User;
}

@Injectable()
export class CompanyLocationsService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,

    private readonly dataSource: DataSource,

    @InjectRepository(CompanyLocation)
    private readonly companyLocationRepository: Repository<CompanyLocation>,

    private readonly companyService: CompanyService,
  ) {}

  async create(
    createCompanyLocationDto: CreateCompanyLocationDto,
    options: options,
  ) {
    const { user } = options;
    const { companyId } = createCompanyLocationDto;

    const isOuwner = await this.companyService.isOuwnerOfCompany(
      companyId,
      user.id,
    );

    if (!isOuwner)
      throw new BadRequestException(this.resMessages.usetIsNotOuwnerOfCompany);

    const location = this.companyLocationRepository.create({
      ...createCompanyLocationDto,
      createById: user.id,
    });

    await this.companyLocationRepository.save(location);

    return location;
  }

  async findAll(
    queryCompanyLocationDto: QueryCompanyLocationDto,
    options: options,
  ) {
    const { user } = options;

    const {
      limit,
      offset,
      companyId,
      name,
      status = StatusObject.active,
    } = queryCompanyLocationDto;

    const locations = await this.companyLocationRepository
      .createQueryBuilder('location')
      .where(
        new Brackets((qb) => {
          qb.where('location.status=:status', { status });

          if (companyId)
            qb.andWhere('location."companyId"=:companyId ', { companyId });

          if (name) qb.andWhere('location.name=:name', { name });
        }),
      )
      .orderBy({ name: 'ASC' })
      .take(limit)
      .skip(offset)
      .getMany();

    return locations;
  }

  async findOne(id: string, options: options) {
    const { user } = options;

    const location = await this.companyLocationRepository
      .createQueryBuilder('location')
      .where(
        new Brackets((qb) => {
          qb.where('location.id=:id', { id });

          if (!isAdmin(user))
            qb.andWhere('location."createById"=:createById', {
              createById: user.id,
            });
        }),
      )
      .getOne();

    if (!location)
      throw new NotFoundException(this.resMessages.companyLocationNotFound);

    return location;
  }

  async update(
    id: string,
    updateCompanyLocationDto: UpdateCompanyLocationDto,
    options: options,
  ) {
    const { user } = options;

    const location = await this.companyLocationRepository.preload({
      id,
      ...updateCompanyLocationDto,
    });

    if (!isAdmin(user) && location.createById != user.id)
      throw new ForbiddenException();

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(location);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return location;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async archive(id: string, options: options) {
    const { user } = options;

    const location = await this.companyLocationRepository.preload({
      id,
      status: StatusObject.archive,
    });

    if (!isAdmin(user) && location.createById != user.id)
      throw new ForbiddenException();

    await this.companyLocationRepository.save(location);

    return location;
  }

  async unarchive(id: string, options: options) {
    const { user } = options;

    const company = await this.companyLocationRepository.preload({
      id,
      status: StatusObject.active,
    });

    if (!isAdmin(user) && company.createById != user.id)
      throw new ForbiddenException();

    await this.companyLocationRepository.save(company);

    return company;
  }
}
