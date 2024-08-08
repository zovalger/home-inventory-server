import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  Patch,
  Param,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities';
import { FamilyRoles } from 'src/family/interfaces';
import { GetUserFamily } from 'src/family/decorators';
import { Family } from 'src/family/entities';
import { CreateProductDto, UpdateProductDto } from './dto';
import { QueryProductDto } from './dto/query-product.dto';

@Controller('products')
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

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.productsService.findOne(+id);
  // }

  @Patch(':id')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @GetUser() user: User,
  ) {
    return this.productsService.update(id, updateProductDto, {
      user,
    });
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.productsService.remove(+id);
  // }
}
