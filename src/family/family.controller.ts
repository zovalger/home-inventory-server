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

import { User } from '../auth/entities';
import { Family, FamilyMember } from './entities';

import { Auth, GetUser } from '../auth/decorators';
import { GetUserFamily, GetUserFamilyMember } from './decorators';

import { FamilyRoles } from './interfaces';
import {
  CreateFamilyDto,
  CreateFamilyInvitationsDto,
  UpdateFamilyDto,
  UpdateRoleMemberDto,
} from './dto';

import { FamilyService } from './family.service';
import { ResMessages, ResponseBodyFormat } from '../common/providers';
import { CreateFamilyPipe, UpdateFamilyPipe } from './pipes';

@Controller('family')
export class FamilyController {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly responseBodyFormat: ResponseBodyFormat,
    private readonly familyService: FamilyService,
  ) {}

  // ************************************************************
  //                    gestion de familias
  // ************************************************************

  @Post()
  @Auth({ withoutFamilyMember: true })
  async create(
    @GetUser() user: User,
    @Body(CreateFamilyPipe) createFamilyDto: CreateFamilyDto,
  ) {
    const family = await this.familyService.create(user, createFamilyDto);

    return this.responseBodyFormat.basic(
      this.resMessages.familyCreated,
      family,
    );
  }

  @Get()
  @Auth()
  myFamily(@GetUserFamily() family: Family) {
    return this.responseBodyFormat.basic(
      this.resMessages.familyObtained,
      family,
    );
  }

  @Patch()
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  async update(
    @GetUserFamily() userFamily: Family,
    @Body(UpdateFamilyPipe) updateFamilyDto: UpdateFamilyDto,
  ) {
    const family = await this.familyService.update(userFamily, updateFamilyDto);

    return this.responseBodyFormat.basic(
      this.resMessages.familyUpdated,
      family,
    );
  }

  // ************************************************************
  //                    gestion de miembros
  // ************************************************************

  @Get('members')
  @Auth()
  getMembers(@GetUserFamily('id') familyId: string) {
    return this.familyService.getMembers(familyId);
  }

  @Patch('members/:id')
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  changeMemberRole(
    @Param('id', new ParseUUIDPipe()) memberId: string,
    @Body() updateRoleMemberDto: UpdateRoleMemberDto,
    @GetUser() user: User,
    @GetUserFamilyMember() userFamilyMember: FamilyMember,
  ) {
    return this.familyService.changeRoleMember(memberId, updateRoleMemberDto, {
      user,
      userFamilyMember,
    });
  }

  @Delete('members/:id')
  @Auth({
    familyRole: [FamilyRoles.ouwner, FamilyRoles.admin, FamilyRoles.adult],
  })
  deleteMember(
    @Param('id', new ParseUUIDPipe()) memberId: string,
    @GetUser() user: User,
    @GetUserFamilyMember() userFamilyMember: FamilyMember,
  ) {
    return this.familyService.deleteMemberFamily(memberId, {
      user,
      userFamilyMember,
    });
  }

  // todo: eliminar grupo
  // todo: dar el rol ouwner a otro miembro

  // ************************************************************
  //                      invitaciones
  // ************************************************************

  @Post('invitations')
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  createInvitations(
    @GetUserFamily() family: Family,
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
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  getInvitationOfFamily(@GetUserFamily('id') familyId: string) {
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
  @Auth({ familyRole: [FamilyRoles.ouwner] })
  cancelInvitation(
    @Param('id', new ParseUUIDPipe()) invitationId: string,
    @GetUserFamily() family: Family,
  ) {
    return this.familyService.cancelInvitation(invitationId, family);
  }
}
