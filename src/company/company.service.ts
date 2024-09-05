import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import {
  CreateQueryRunner,
  ErrorHandleProvider,
  ResMessages,
} from '../common/providers';
import { Brackets, DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Company } from './entities';
import { FilesService } from 'src/files/files.service';
import { EmailService } from 'src/email/email.service';
import { User } from 'src/auth/entities';
import { QueryCompanyDto } from './dto';
import { ValidRoles } from 'src/auth/interface/valid-roles';

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

  async create(createCompanyDto: CreateCompanyDto, user: User) {
    // const { imageUrl } = createCompanyDto;

    // todo: verificar subcripcion

    // if (imageUrl) {
    //   const existImage = await this.filesService.existImageInDB(imageUrl);
    //   if (!existImage)
    //     throw new BadRequestException(this.resMessages.imageNotFound);
    // }

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

  async findAll(
    queryCompanyLocationDto: QueryCompanyDto,
    options: { user: User },
  ) {
    const { user } = options;
    const { limit = 10, offset = 0, createById } = queryCompanyLocationDto;

    const companies = await this.companyRepository
      .createQueryBuilder('company')
      .where(
        new Brackets((qb) => {
          if (user.roles.includes(ValidRoles.admin)) {
            if (createById) {
              qb.where('company."createById"=:createById', {
                createById,
              });
            }
          } else {
            qb.andWhere('company."createById"=:createById', {
              createById: user.id,
            });
          }
        }),
      )
      .orderBy({ name: 'ASC' })
      .take(limit)
      .skip(offset)
      .getMany();

    return companies;
  }

  async findOneById(id: string) {
    const company = await this.companyRepository.findOneBy({ id });

    if (!company)
      throw new NotFoundException(this.resMessages.invitationNotFound);

    return company;
  }

  async findOneByUser(userId: string) {
    // todo: donde tambien sea empleado
    return await this.companyRepository.findBy({
      createById: userId,
    });
  }

  async update(id: string, updateCompanyDto: UpdateCompanyDto) {
    const company = await this.companyRepository.preload({
      id,
      ...updateCompanyDto,
    });

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

  // remove(id: string) {
  //   return `This action removes a #${id} company`;
  // }
}
