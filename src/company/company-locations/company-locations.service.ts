import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { CompanyLocation } from './entities';
import {
  CreateCompanyLocationDto,
  QueryCompanyLocationDto,
  UpdateCompanyLocationDto,
} from './dto';
import { StatusObject } from 'src/common/interfaces';

@Injectable()
export class CompanyLocationsService {
  constructor(
    @InjectRepository(CompanyLocation)
    private readonly companyLocationRepository: Repository<CompanyLocation>,
  ) {}

  // todo: usuario
  async create(createCompanyLocationDto: CreateCompanyLocationDto) {
    const location = this.companyLocationRepository.create(
      createCompanyLocationDto,
    );

    await this.companyLocationRepository.save(location);

    return location;
  }

  async findAll(queryCompanyLocationDto: QueryCompanyLocationDto) {
    const { limit, offset, companyId } = queryCompanyLocationDto;

    return await this.companyLocationRepository.find({
      where: { companyId },
      order: { name: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findOne(id: string) {
    return await this.companyLocationRepository.findOneBy({ id });
  }

  async update(id: string, updateCompanyLocationDto: UpdateCompanyLocationDto) {
    const location = await this.companyLocationRepository.preload({
      id,
      ...updateCompanyLocationDto,
    });

    await this.companyLocationRepository.save(location);

    return location;
  }

  async archive(id: string) {
    const location = await this.companyLocationRepository.preload({
      id,
      status: StatusObject.archive,
    });

    await this.companyLocationRepository.save(location);

    return location;
  }

  // remove(id: number) {
  //   return `This action removes a #${id} companyLocation`;
  // }
}
