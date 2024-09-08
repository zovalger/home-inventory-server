import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';

import { CompanyService } from './company.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Auth, GetUser } from 'src/auth/decorators';
import { User } from '../auth/entities';
import { ResMessages, ResponseBodyFormat } from '../common/providers';
import { CreateCompanyPipe, UpdateCompanyPipe } from './pipes';
import { QueryCompanyDto } from './dto';

@Controller('companies')
export class CompanyController {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly responseBodyFormat: ResponseBodyFormat,
    private readonly companyService: CompanyService,
  ) {}

  @Post()
  @Auth()
  async create(
    @GetUser() user: User,
    @Body(CreateCompanyPipe) createFamilyDto: CreateCompanyDto,
  ) {
    const company = await this.companyService.create(createFamilyDto, { user });

    return this.responseBodyFormat.basic(
      this.resMessages.companyCreated,
      company,
    );
  }

  @Get()
  @Auth()
  async findAll(
    @Query() queryProductDto: QueryCompanyDto,
    @GetUser() user: User,
  ) {
    const companies = await this.companyService.findAll(queryProductDto, {
      user,
    });

    return this.responseBodyFormat.basic(
      this.resMessages.companiesObtained,
      companies,
    );
  }

  @Get(':id')
  @Auth()
  async findOneById(@Param('id') id: string, @GetUser() user: User) {
    const company = await this.companyService.findOne(id, { user });

    return company;
  }

  @Patch(':id')
  @Auth()
  async update(
    @Param('id') id: string,
    @Body(UpdateCompanyPipe) updateCompanyDto: UpdateCompanyDto,
    @GetUser() user: User,
  ) {
    const company = await this.companyService.update(id, updateCompanyDto, {
      user,
    });

    return this.responseBodyFormat.basic(
      this.resMessages.companyUpdated,
      company,
    );
  }

  @Patch(':id/archive')
  @Auth()
  archive(@Param('id') id: string, @GetUser() user: User) {
    return this.companyService.archive(id, { user });
  }
}
