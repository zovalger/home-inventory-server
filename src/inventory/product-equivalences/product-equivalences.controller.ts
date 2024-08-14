import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { Family } from '../../family/entities';

import { Auth } from '../../auth/decorators';
import { FamilyRoles } from '../../family/interfaces';
import {
  CreateProductEquivalenceDto,
  UpdateProductEquivalenceDto,
} from '../dto';
import { ProductEquivalencesService } from './product-equivalences.service';
import { GetUserFamily } from '../../family/decorators';

@Controller('inventory/equivalences')
export class ProductEquivalencesController {
  constructor(
    private readonly productEquivalencesService: ProductEquivalencesService,
  ) {}

  @Post(':productId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  addEquivalences(
    @Param('productId') productId: string,
    @Body() createProductEquivalenceDto: CreateProductEquivalenceDto,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productEquivalencesService.addEquivalence(
      productId,
      createProductEquivalenceDto,
      {
        userFamily,
      },
    );
  }

  @Get(':productId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  getProductEquivalences(
    @Param('productId') productId: string,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productEquivalencesService.getProductEquivalences(productId, {
      userFamily,
    });
  }

  @Get()
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  getEquivalences(@GetUserFamily() userFamily: Family) {
    return this.productEquivalencesService.getEquivalences({
      userFamily,
    });
  }

  @Patch('id/:eqId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  updateProductEquivalences(
    @Param('eqId') eqId: string,
    @Body() updateProductEquivalenceDto: UpdateProductEquivalenceDto,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productEquivalencesService.updateEquivalence(
      eqId,
      updateProductEquivalenceDto,
      {
        userFamily,
      },
    );
  }

  @Delete('id/:eqId')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  deleteProductEquivalence(
    @Param('eqId') eqId: string,
    @GetUserFamily() userFamily: Family,
  ) {
    return this.productEquivalencesService.deleteEquivalence(eqId, {
      userFamily,
    });
  }
}
