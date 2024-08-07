import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Delete,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';

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
import { UpdateRoleMemberDto } from './dto';

@Controller('family')
export class FamilyController {
  constructor(private readonly familyService: FamilyService) {}

  // ************************************************************
  //                    gestion de familias
  // ************************************************************

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
    @GetFamily('id') familyId: string,
    @Body() updateFamilyDto: UpdateFamilyDto,
  ) {
    return this.familyService.update(familyId, updateFamilyDto);
  }

  // ************************************************************
  //                    gestion de miembros
  // ************************************************************

  @Get('members')
  @Auth()
  getMembers(@GetFamily('id') familyId: string) {
    return this.familyService.getMembers(familyId);
  }

  // todo: por probar
  @Patch('members/:id')
  @Auth({ familyRole: [FamilyRoles.admin, FamilyRoles.ouwner] })
  changeMemberRole(
    @Param('id', new ParseUUIDPipe()) memberId: string,
    @Body() updateRoleMemberDto: UpdateRoleMemberDto,
    @GetUser() user: User,
    @GetFamily() family: Family,
  ) {
    return this.familyService.updateMember(
      memberId,
      updateRoleMemberDto,
      user,
      family,
    );
  }

  // @Delete('members/:email')
  // deleteMember(@Param('email') email: string) {
  //   return this.familyService.update();
  // }

  // ************************************************************
  //                      invitaciones
  // ************************************************************

  @Post('invitations')
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  createInvitations(
    @GetFamily() family: Family,
    @GetUser() user: User,
    @Body() createFamilyInvitationsDto: CreateFamilyInvitationsDto,
  ) {
    return this.familyService.createFamilyInvitations(
      family,
      createFamilyInvitationsDto,
      user,
    );
  }

  // todo: colocar query segun estado
  @Get('invitations')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  getInvitationOfFamily(@GetFamily('id') familyId: string) {
    return this.familyService.getInvitationOfFamily(familyId);
  }

  // todo: colocar query segun estado
  @Get('invitations/to_my')
  @Auth({ withoutFamilyMember: true })
  getInvitationToMy(@GetUser('email') userEmail: string) {
    return this.familyService.invitationToMy(userEmail);
  }

  // todo: accept
  @Post('invitations/:id/accept')
  @Auth({ withoutFamilyMember: true })
  acceptInvitation(
    @Param('id', new ParseUUIDPipe()) invitationId: string,
    @GetUser() user: User,
  ) {
    return this.familyService.acceptInvitation(invitationId, user);
  }

  @Delete('invitations/:id/reject')
  @Auth({ withoutFamilyMember: true })
  rejecteInvitation(
    @Param('id', new ParseUUIDPipe()) invitationId: string,
    @GetUser() user: User,
  ) {
    return this.familyService.rejecteInvitation(invitationId, user);
  }

  @Delete('invitations/:id/cancel')
  @Auth({ familyRole: [FamilyRoles.ouwner, FamilyRoles.admin] })
  cancelInvitation(
    @Param('id', new ParseUUIDPipe()) invitationId: string,
    @GetFamily() family: Family,
  ) {
    return this.familyService.cancelInvitation(invitationId, family);
  }
}
