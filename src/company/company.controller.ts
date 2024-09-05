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
import { QueryProductDto } from 'src/inventory/dto';

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
    const company = await this.companyService.create(createFamilyDto, user);

    return this.responseBodyFormat.basic(
      this.resMessages.familyCreated,
      company,
    );
  }

  @Get()
  @Auth()
  async findAll(
    @Query() queryProductDto: QueryProductDto,
    @GetUser() user: User,
  ) {
    const companies = await this.companyService.findAll(queryProductDto, {
      user,
    });

    return this.responseBodyFormat.basic(
      this.resMessages.familyObtained,
      companies,
    );
  }

  @Get(':id')
  @Auth()
  async findOneById(@Param('id') id: string) {
    const company = await this.companyService.findOneById(id);

    return company;
  }

  @Patch(':id')
  @Auth()
  async update(
    @Param('id') id: string,
    @Body(UpdateCompanyPipe) updateCompanyDto: UpdateCompanyDto,
  ) {
    const company = await this.companyService.update(id, updateCompanyDto);

    return this.responseBodyFormat.basic(
      this.resMessages.familyUpdated,
      company,
    );
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.companyService.remove(+id);
  // }
}
