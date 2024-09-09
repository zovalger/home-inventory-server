import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  CreateQueryRunner,
  ErrorHandleProvider,
  ResMessages,
} from '../common/providers';
import { Brackets, DataSource, Like, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities';
import { FilesService } from '../files/files.service';
import { EmailService } from '../email/email.service';
import { User } from '../auth/entities';
import { QueryCompanyDto } from './dto';
import { ValidRoles } from '../auth/interface/valid-roles';
import { StatusObject } from '../common/interfaces';
import { isAdmin } from '../auth/helpers/is-admin';

interface options {
  user: User;
}

@Injectable()
export class CompanyService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
    private readonly dataSource: DataSource,

    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,

    private readonly createQueryRunner: CreateQueryRunner,

    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
  ) {}

  // const { imageUrl } = createCompanyDto;

  // todo: verificar subcripcion

  // if (imageUrl) {
  //   const existImage = await this.filesService.existImageInDB(imageUrl);
  //   if (!existImage)
  //     throw new BadRequestException(this.resMessages.imageNotFound);
  // }

  async create(createCompanyDto: CreateCompanyDto, options: options) {
    const { user } = options;
    const { name } = createCompanyDto;

    const otherCompany = await this.companyRepository.findOneBy({
      name: Like(name),
      createById: user.id,
    });

    if (otherCompany)
      throw new BadRequestException(this.resMessages.companyAlreadyExist);

    const queryRunner = await this.createQueryRunner.create();

    try {
      const company = this.companyRepository.create({
        ...createCompanyDto,
        createById: user.id,
      });

      await queryRunner.manager.save(company);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return company;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async findAll(queryCompanyLocationDto: QueryCompanyDto, options: options) {
    const { user } = options;
    const {
      limit = 10,
      offset = 0,
      status = StatusObject.active,
      createById,
      name,
    } = queryCompanyLocationDto;

    const userId = user.roles.includes(ValidRoles.admin)
      ? createById
        ? createById
        : user.id
      : user.id;

    const companies = await this.companyRepository
      .createQueryBuilder('company')
      .where(
        new Brackets((qb) => {
          qb.where('company.status=:status', { status });

          qb.andWhere('company."createById"=:userId', {
            userId,
          });

          if (name)
            qb.andWhere('company.name like :name', {
              name: `%${name}%`,
            });
        }),
      )
      .orderBy({ name: 'ASC' })
      .take(limit)
      .skip(offset)
      .getMany();

    return companies;
  }

  async findOne(id: string, options: options) {
    const { user } = options;

    const company = await this.companyRepository
      .createQueryBuilder('company')
      .where(
        new Brackets((qb) => {
          qb.where('company.id=:id', { id });

          if (!isAdmin(user))
            qb.andWhere('company."createById"=:createById', {
              createById: user.id,
            });
        }),
      )
      .getOne();

    if (!company) throw new NotFoundException(this.resMessages.companyNotFound);

    return company;
  }

  async update(
    id: string,
    updateCompanyDto: UpdateCompanyDto,
    options: options,
  ) {
    const { user } = options;

    const company = await this.companyRepository.preload({
      id,
      ...updateCompanyDto,
    });

    if (!isAdmin(user) && company.createById != user.id)
      throw new ForbiddenException();

    const queryRunner = await this.createQueryRunner.create();

    try {
      await queryRunner.manager.save(company);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return company;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.errorHandleProvider.handle(error);
    }
  }

  async archive(id: string, options: options) {
    const { user } = options;

    const company = await this.companyRepository.preload({
      id,
      status: StatusObject.archive,
    });

    if (!isAdmin(user) && company.createById != user.id)
      throw new ForbiddenException();

    await this.companyRepository.save(company);

    return company;
  }

  async unarchive(id: string, options: options) {
    const { user } = options;

    const company = await this.companyRepository.preload({
      id,
      status: StatusObject.active,
    });

    if (!isAdmin(user) && company.createById != user.id)
      throw new ForbiddenException();

    await this.companyRepository.save(company);

    return company;
  }

  // utils

  async isOuwnerOfCompany(companyId: string, userId: string): Promise<boolean> {
    return await this.companyRepository.existsBy({
      id: companyId,
      createById: userId,
    });
  }
}
