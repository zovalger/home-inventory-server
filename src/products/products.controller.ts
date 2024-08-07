import { Controller, Post, Body } from '@nestjs/common';
import { ProductsService } from './products.service';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities';
import { FamilyRoles } from 'src/family/interfaces';
import { GetUserFamily } from 'src/family/decorators';
import { Family } from 'src/family/entities';
import { CreateProductDto } from './dto';

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

  // @Get()
  // @Auth()
  // findAll(@GetUser() user: User) {
  //   return user; // this.productsService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.productsService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateProductDto: UpdateProductDto) {
  //   return this.productsService.update(+id, updateProductDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.productsService.remove(+id);
  // }
}
