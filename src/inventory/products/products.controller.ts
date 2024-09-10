import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';

import { User } from '../../auth/entities';
import { CreateProductDto, UpdateProductDto } from '../dto';

import { ProductsService } from './products.service';
import { QueryProductDto } from '../dto/query-product.dto';
import { CompanyService } from 'src/company/company.service';
import { ResMessages, ResponseBodyFormat } from 'src/common/providers';
import { Auth, GetUser } from 'src/auth/decorators';

@Controller('inventory/products')
export class ProductsController {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly responseBodyFormat: ResponseBodyFormat,

    private readonly companyService: CompanyService,
    private readonly productsService: ProductsService,
  ) {}

  @Post()
  @Auth()
  async create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
  ) {
    const product = await this.productsService.create(createProductDto, {
      user,
    });

    return this.responseBodyFormat.basic(
      this.resMessages.productCreated,
      product,
    );
  }

  @Get()
  @Auth()
  findAll(@Query() queryProductDto: QueryProductDto, @GetUser() user: User) {
    return this.productsService.findAll(queryProductDto, { user });
  }

  @Get(':productId')
  @Auth()
  findOne(@Param('productId') id: string, @GetUser() user: User) {
    return this.productsService.findById(id, { user });
  }

  @Patch(':productId')
  @Auth()
  update(
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.update(productId, updateProductDto, {
      user,
    });
  }

  @Post(':id/archive')
  @Auth()
  archive(@Param('id') id: string, @GetUser() user: User) {
    return this.productsService.archive(id, { user });
  }

  @Post(':id/unarchive')
  @Auth()
  unarchive(@Param('id') id: string, @GetUser() user: User) {
    return this.productsService.unarchive(id, { user });
  }
}
