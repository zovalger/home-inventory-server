import { Controller, Post, Body, Get, Patch } from '@nestjs/common';

import { FamilyService } from './family.service';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { GetUser } from 'src/auth/decorators/get-user.decorator';
import { User } from 'src/auth/entities';
import { Auth } from 'src/auth/decorators/auth.decorator';
import { FamilyRoles } from './interfaces';
import { GetFamily } from './decorators/get-family.decorator';
import { Family } from './entities';
import { CreateFamilyInvitationsDto } from './dto/create-family-invitations.dto';

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  @Post()
  @Auth({ withoutFamilyMember: true })
  create(@GetUser() user: User, @Body() createFamilyDto: CreateFamilyDto) {
    return this.familyService.create(user, createFamilyDto);
  }

  @Get()
  @Auth()
  myFamily(@GetFamily() family: Family) {
    return family;
  }

  @Patch()
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  update(
    // @GetUser() user: User,
    // @Param('id') id: string,
    @GetFamily('id') familyId: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.familyService.update(familyId, updateFamilyDto);
  }

  // // gestionar miembros

  @Get('members')
  @Auth()
  getMembers(@GetFamily('id') familyId: string) {
    return this.familyService.getMembers(familyId);
  }

  @Post('members/invitation')
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  createInvitations(
    @GetFamily('id') familyId: string,
    @GetUser('id') userId: string,
    @Body() createFamilyInvitationsDto: CreateFamilyInvitationsDto,
  ) {
    return this.familyService.createFamilyInvitations(
      familyId,
      createFamilyInvitationsDto,
      userId,
    );
  }

  // @Delete('members/:email')
  // deleteMember(@Param('email') email: string) {
  //   return this.familyService.update();
  // }
}
