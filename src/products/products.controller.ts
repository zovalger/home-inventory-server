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
import { ProductsService } from './products.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities';
import { FamilyRoles } from 'src/family/interfaces';
import { GetUserFamily } from 'src/family/decorators';
import { Family } from 'src/family/entities';
import {
  CreateProductDto,
  CreateProductEquivalenceDto,
  CreateProductTransactionDto,
  UpdateProductDto,
  UpdateProductEquivalenceDto,
} from './dto';
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
    return this.productsService.moveToTrash(productId, { userFamily });
  }

  // ************************************************************
  //                        equivalencias
  // ************************************************************

  @Post(':productId/equivalences')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  addEquivalences(
    @Param('productId') productId: string,
    @Body() createProductEquivalenceDto: CreateProductEquivalenceDto,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.addEquivalence(
      productId,
      createProductEquivalenceDto,
      {
        userFamily,
      },
    );
  }

  @Get(':productId/equivalences')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  getProductEquivalences(
    @Param('productId') productId: string,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.getProductEquivalences(productId, {
      userFamily,
    });
  }

  @Get('equivalences')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  getEquivalences(@GetUserFamily() userFamily: Family) {
    return this.productsService.getEquivalences({
      userFamily,
    });
  }

  @Patch('equivalences/:eqId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  updateProductEquivalences(
    @Param('eqId') eqId: string,
    @Body() updateProductEquivalenceDto: UpdateProductEquivalenceDto,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.updateEquivalence(
      eqId,
      updateProductEquivalenceDto,
      {
        userFamily,
      },
    );
  }

  @Delete('equivalences/:eqId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  deleteProductEquivalence(
    @Param('eqId') eqId: string,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.deleteEquivalence(eqId, {
      userFamily,
    });
  }

  // ************************************************************
  //                        transaction
  // ************************************************************

  @Post(':productId/transaction')
  @Auth()
  createTransaction(
    @Param('productId') productId: string,
    @Body() createProductTransactionDto: CreateProductTransactionDto,
    @GetUser() user: User,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productsService.createTransaction(
      productId,
      createProductTransactionDto,
      {
        user,
        userFamily,
      },
    );
  }
}
