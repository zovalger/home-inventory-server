import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
} from '@nestjs/common';

import { Auth, GetUser } from '../auth/decorators';

import {
  CreateCompanyLocationDto,
  QueryCompanyLocationDto,
  UpdateCompanyLocationDto,
} from './dto';

import { CompanyLocationsService } from './company-locations.service';
import { User } from 'src/auth/entities';
import { ResMessages, ResponseBodyFormat } from 'src/common/providers';

@Controller('company-locations')
export class CompanyLocationsController {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly responseBodyFormat: ResponseBodyFormat,

    private readonly companyLocationsService: CompanyLocationsService,
  ) {}

  @Post()
  @Auth()
  async create(
    @GetUser() user: User,
    @Body() createCompanyLocationDto: CreateCompanyLocationDto,
  ) {
    const location = await this.companyLocationsService.create(
      createCompanyLocationDto,
      {
        user,
      },
    );

    return this.responseBodyFormat.basic(
      this.resMessages.companyLocationHasCreated,
      location,
    );
  }

  @Get()
  @Auth()
  async findAll(
    @GetUser() user: User,
    @Query() queryCompanyLocationDto: QueryCompanyLocationDto,
  ) {
    return await this.companyLocationsService.findAll(queryCompanyLocationDto, {
      user,
    });
  }

  @Get(':id')
  @Auth()
  async findOne(@GetUser() user: User, @Param('id') id: string) {
    return await this.companyLocationsService.findOne(id, { user });
  }

  @Patch(':id')
  @Auth()
  update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateCompanyLocationDto: UpdateCompanyLocationDto,
  ) {
    return this.companyLocationsService.update(id, updateCompanyLocationDto, {
      user,
    });
  }

  @Post(':id/archive')
  @Auth()
  archive(@Param('id') id: string, @GetUser() user: User) {
    return this.companyLocationsService.archive(id, { user });
  }

  @Post(':id/unarchive')
  @Auth()
  unarchive(@Param('id') id: string, @GetUser() user: User) {
    return this.companyLocationsService.unarchive(id, { user });
  }
}
