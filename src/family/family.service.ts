import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { User } from 'src/auth/entities';
import { Family, FamilyMember, FamilyMemberInvitation } from './entities';

import { FamilyMemberInvitationStatus, FamilyRoles } from './interfaces';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { CreateFamilyInvitationsDto } from './dto/create-family-invitations.dto';

import { FilesService } from 'src/files/files.service';
import { ResMessages } from 'src/config/res-messages';
import { EmailService } from 'src/email/email.service';

@Injectable()
export class FamilyService {
  constructor(
    private readonly dataSource: DataSource,

    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,
    @InjectRepository(FamilyMemberInvitation)
    private readonly familyMemberInvitationRepository: Repository<FamilyMemberInvitation>,

    private readonly filesService: FilesService,
    private readonly emailService: EmailService,
  ) {}

  async create(user: User, createFamilyDto: CreateFamilyDto) {
    const { imageUrl } = createFamilyDto;

    const isMemberOfOneFamily = !!(await this.familyMemberRepository.countBy({
      userId: user.id,
    }));

    if (isMemberOfOneFamily)
      throw new BadRequestException('The user already has a family group');

    if (imageUrl) {
      const existImage = await this.filesService.existImageInDB(imageUrl);
      if (!existImage) throw new BadRequestException(ResMessages.ImageNotFound);
    }

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const family = this.familyRepository.create({
        ...createFamilyDto,
        createById: user.id,
      });

      await queryRunner.manager.save(family);

      const member = this.familyMemberRepository.create({
        family,
        user,
        role: FamilyRoles.ouwner,
      });

      await queryRunner.manager.save(member);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return family;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  async getFamily_by_id(id: string) {
    const family = await this.familyRepository.findOneBy({
      id,
    });

    if (!family) throw new NotFoundException(ResMessages.invitationNotFound);

    return family;
  }

  async myFamily(user: User) {
    try {
      const family = await this.familyRepository.findOne({
        where: { members: { userId: user.id } },
        relations: { members: { user: true } },
      });

      if (!family)
        throw new NotFoundException("The user haven't a family group");

      return family;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async update(id: string, updateFamilyDto: UpdateFamilyDto) {
    const { imageUrl, name } = updateFamilyDto;

    if (imageUrl) {
      const existImage = await this.filesService.existImageInDB(imageUrl);
      if (!existImage) throw new BadRequestException(ResMessages.ImageNotFound);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const family = await this.familyRepository.findOneBy({
        id,
      });

      if (!family) throw new NotFoundException(ResMessages.familyNotFound);

      const { imageUrl: oldImageUrl } = family;

      family.imageUrl = imageUrl != undefined ? imageUrl : oldImageUrl;

      if (name) family.name = name;

      await queryRunner.manager.save(family);

      if (imageUrl != undefined && oldImageUrl && imageUrl != oldImageUrl)
        await this.filesService.deleteImageByQueryRunner(
          queryRunner,
          oldImageUrl,
        );

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return family;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }
  }

  // ************************************************************
  //                    gestion de miembros
  // ************************************************************

  async getMembers(familyId: string) {
    try {
      const members = await this.familyMemberRepository.find({
        where: { familyId },
        relations: { user: true },
      });

      if (!members.length)
        throw new NotFoundException(ResMessages.familyNotHaveMembers);

      return members;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  // todo: probar
  async isMemberOfThisFamily(
    userId: string,
    familyId: string,
  ): Promise<boolean> {
    return !!(await this.familyMemberRepository.countBy({ userId, familyId }));
  }

  async isMemberOfAnyFamily(userId: string): Promise<FamilyMember> {
    return await this.familyMemberRepository.findOneBy({ userId });
  }

  // ************************************************************
  //                      invitaciones
  // ************************************************************

  // todo: probar
  async createFamilyInvitations(
    family: Family,
    createFamilyInvitationsDto: CreateFamilyInvitationsDto,
    user: User,
  ) {
    const resultInvitations = {
      notInvited: { alreadyMember: [], alreadyInvited: [] },
      invited: [],
    };

    const { invitations } = createFamilyInvitationsDto;

    let guestEmailsToSave = invitations.map((inv) => inv.guestEmail);

    //todo: ver que ya no este en la familia
    const emailsAlreadyMember = (
      await this.familyMemberRepository.find({
        where: { user: { email: In(guestEmailsToSave) } },
        relations: { user: true },
        select: { user: { email: true } },
      })
    ).map((i) => i.user.email);

    guestEmailsToSave = guestEmailsToSave.filter((email) => {
      const isMember = emailsAlreadyMember.includes(email);

      if (isMember) resultInvitations.notInvited.alreadyMember.push(email);

      return !isMember;
    });

    // todo: ver si tiene invitacion pendiente
    const oldInvitations = (
      await this.familyMemberInvitationRepository.find({
        where: {
          familyId: family.id,
          guestEmail: In(guestEmailsToSave),
          status: FamilyMemberInvitationStatus.pending,
        },
      })
    ).map((i) => i.guestEmail);

    guestEmailsToSave = guestEmailsToSave.filter((email) => {
      const alreadyInvited = oldInvitations.includes(email);

      if (alreadyInvited)
        resultInvitations.notInvited.alreadyInvited.push(email);

      return !alreadyInvited;
    });

    if (!guestEmailsToSave.length)
      throw new BadRequestException({
        message: ResMessages.notUserToInvite,
        invitations: resultInvitations,
      });

    resultInvitations.invited = guestEmailsToSave;

    const toInvite = invitations.filter((i) =>
      guestEmailsToSave.includes(i.guestEmail),
    );

    const invitationsData = toInvite.map((inv) => {
      return {
        ...inv,
        createById: user.id,
        familyId: family.id,
      };
    });

    try {
      const invitationsDB =
        this.familyMemberInvitationRepository.create(invitationsData);

      await this.familyMemberInvitationRepository.save(invitationsDB);

      await this.emailService.sendEmail_InviteUsers({
        familyName: family.name,
        createByUserName: user.name,
        invitations: invitationsData,
      });

      return { invitations: resultInvitations };
    } catch (error) {
      this.handleDBError(error);
    }
  }

  // async doesUserHaveaFamily() {}

  // todo: probar
  async getInvitation_by_id(id: string): Promise<FamilyMemberInvitation> {
    const invitation = await this.familyMemberInvitationRepository.findOneBy({
      id,
    });

    if (!invitation)
      throw new NotFoundException(ResMessages.invitationNotFound);

    return invitation;
  }

  async getInvitationOfFamily(
    familyId: string,
  ): Promise<FamilyMemberInvitation[]> {
    return await this.familyMemberInvitationRepository.findBy({
      familyId,
    });
  }

  async invitationToMy(userEmail: string): Promise<FamilyMemberInvitation[]> {
    return await this.familyMemberInvitationRepository.find({
      where: { guestEmail: userEmail },
      select: {
        family: { imageUrl: true, name: true, tier: true },
        createBy: { name: true, lastName: true, email: true, imageUrl: true },
      },
      relations: { family: true, createBy: true },
    });
  }

  // todo: probar
  async acceptInvitation(invitationId: string, user: User) {
    const invitation = await this.getInvitation_by_id(invitationId);
    const { guestEmail, familyId, role } = invitation;

    // todo: ver si el usuario es el de la invitacion
    if (guestEmail != user.email)
      throw new ForbiddenException(ResMessages.UserForbidden);

    // todo: ver si el usuario ya es miembro
    const isMember = await this.isMemberOfAnyFamily(user.id);
    if (isMember)
      throw new BadRequestException(
        isMember.familyId == familyId
          ? ResMessages.isAlreadyMember
          : ResMessages.memberHasOtherFamily,
      );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // todo: modificar estado de la inviacion
      invitation.status = FamilyMemberInvitationStatus.acepted;
      await queryRunner.manager.save(invitation);

      // todo: crear nuevo miembro

      const member = this.familyMemberRepository.create({
        role,
        familyId,
        userId: user.id,
      });

      await queryRunner.manager.save(member);

      await queryRunner.commitTransaction();
      await queryRunner.release();

      return { invitation, member };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      await queryRunner.release();

      this.handleDBError(error);
    }

    // const family=
  }

  // todo: probar
  async rejecteInvitation(invitationId: string, user: User) {
    const { email } = user;

    const invitation = await this.getInvitation_by_id(invitationId);

    if (invitation.status != FamilyMemberInvitationStatus.pending)
      throw new BadRequestException(ResMessages.invitationIsNotActive);

    if (email != invitation.guestEmail)
      throw new ForbiddenException(ResMessages.UserForbidden);

    try {
      invitation.status = FamilyMemberInvitationStatus.rejected;

      await this.familyMemberInvitationRepository.save(invitation);

      return invitation;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async cancelInvitation(invitationId: string, family: Family) {
    const invitation = await this.getInvitation_by_id(invitationId);

    if (invitation.status != FamilyMemberInvitationStatus.pending)
      throw new BadRequestException(ResMessages.invitationIsNotActive);

    if (invitation.familyId != family.id)
      throw new ForbiddenException(ResMessages.UserForbidden);

    try {
      invitation.status = FamilyMemberInvitationStatus.canceled;

      await this.familyMemberInvitationRepository.save(invitation);

      return invitation;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  handleDBError(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('Is already register');

    if (error.status == 404) throw new NotFoundException(error.response);

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
