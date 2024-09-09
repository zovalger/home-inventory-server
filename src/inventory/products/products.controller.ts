import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
  Delete,
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
  findOne(@Param('productId') id: string, @GetUserFamily() userFamily: Family) {
    return this.productsService.getProduct(id, { userFamily });
  }

  @Patch(':productId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  update(
    @Param('productId') productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.update(productId, updateProductDto, {
      userFamily,
    });
  }

  @Delete(':productId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  moveToTrash(
    @Param('productId') productId: string,
    @GetUser() user: User,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.moveToArchive(productId, { userFamily });
  }

  @Post(':productId/unarchived')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  unarchived(
    @Param('productId') productId: string,
    @GetUser() user: User,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.unarchived(productId, { userFamily });
  }
}
