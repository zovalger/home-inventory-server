import { Controller, Post, Body, Get, Param, Patch } from '@nestjs/common';
import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities';
import { Auth } from 'src/auth/decorators/auth.decorator';

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @Auth()
  create(@GetUser() user: User, @Body() createFamilyDto: CreateFamilyDto) {
    return this.familyService.create(user, createFamilyDto);
  }

  @Get()
  @Auth()
  myFamily(@GetUser() user: User) {
    return this.familyService.myFamily(user);
  }

  @Patch(':id')
  @Auth()
  update(
    @GetUser() user: User,
    @Param('id') id: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.familyService.update(id, updateFamilyDto, user);
  }

  // // gestionar miembros
  // @Post('members')
  // addMember() {
  //   return this.familyService.findOne(+id);
  // }

  // @Delete('members/:email')
  // deleteMember(@Param('email') email: string) {
  //   return this.familyService.update();
  // }
}
