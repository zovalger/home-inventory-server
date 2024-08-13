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

import { Family } from '../../family/entities';
import { User } from '../../auth/entities';

import { Auth, GetUser } from '../../auth/decorators';
import { GetUserFamily } from '../../family/decorators';
import { FamilyRoles } from '../../family/interfaces';
import { CreateProductDto, UpdateProductDto } from '../dto';

import { ProductsService } from './products.service';
import { QueryProductDto } from '../dto/query-product.dto';

@Controller('inventory/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  create(
    @Body() createProductDto: CreateProductDto,
    @GetUser() user: User,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.create(createProductDto, { user, userFamily });
  }

  @Get()
  @Auth()
  findAll(
    @Query() queryProductDto: QueryProductDto,
    @GetUserFamily('id') userFamilyId: string,
  ) {
    return this.productsService.findAll(userFamilyId, queryProductDto);
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
