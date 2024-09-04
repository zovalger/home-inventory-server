import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';

import { Auth } from '../../auth/decorators';

import {
  CreateCompanyLocationDto,
  QueryCompanyLocationDto,
  UpdateCompanyLocationDto,
} from './dto';

import { CompanyLocationsService } from './company-locations.service';

@Controller('company-locations')
export class CompanyLocationsController {
  constructor(
    private readonly companyLocationsService: CompanyLocationsService,
  ) {}

  @Post()
  @Auth()
  create(@Body() createCompanyLocationDto: CreateCompanyLocationDto) {
    return this.companyLocationsService.create(createCompanyLocationDto);
  }

  @Get()
  @Auth()
  async findAll(@Query() queryCompanyLocationDto: QueryCompanyLocationDto) {
    return await this.companyLocationsService.findAll(queryCompanyLocationDto);
  }

  @Get(':id')
  @Auth()
  async findOne(@Param('id') id: string) {
    return await this.companyLocationsService.findOne(id);
  }

  @Patch(':id')
  @Auth()
  update(
    @Param('id') id: string,
    @Body() updateCompanyLocationDto: UpdateCompanyLocationDto,
  ) {
    return this.companyLocationsService.update(id, updateCompanyLocationDto);
  }

  @Patch(':id/archive')
  @Auth()
  archive(@Param('id') id: string) {
    return this.companyLocationsService.archive(id);
  }
}
