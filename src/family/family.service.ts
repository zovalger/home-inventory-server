import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';

import { User } from '../auth/entities';
import { Family, FamilyMember, FamilyMemberInvitation } from './entities';

import { FamilyMemberInvitationStatus, FamilyRoles } from './interfaces';
import {
  CreateFamilyDto,
  CreateFamilyInvitationsDto,
  UpdateFamilyDto,
  UpdateRoleMemberDto,
} from './dto';

import { ErrorHandleProvider, ResMessages } from '../common/providers';
import { FilesService } from '../files/files.service';
import { EmailService } from '../email/email.service';
import { AllUserData } from '../common/interfaces';

@Injectable()
export class FamilyService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly errorHandleProvider: ErrorHandleProvider,
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

  async create(user: User, createFamilyDto: CreateFamilyDto): Promise<Family> {
    const { imageUrl } = createFamilyDto;

    const isMemberOfOneFamily = await this.familyMemberRepository.existsBy({
      userId: user.id,
    });

    if (isMemberOfOneFamily)
      throw new BadRequestException(this.resMessages.userAlreadyInFamilyGroup);

    if (imageUrl) {
      const existImage = await this.filesService.existImageInDB(imageUrl);
      if (!existImage)
        throw new BadRequestException(this.resMessages.imageNotFound);
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

      this.errorHandleProvider.handle(error);
    }
  }

  async getFamily_by_id(id: string) {
    const family = await this.familyRepository.findOneBy({
      id,
    });

    if (!family)
      throw new NotFoundException(this.resMessages.invitationNotFound);

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
      this.errorHandleProvider.handle(error);
    }
  }

  async update(family: Family, updateFamilyDto: UpdateFamilyDto) {
    const { imageUrl, name } = updateFamilyDto;

    if (imageUrl) {
      const existImage = await this.filesService.existImageInDB(imageUrl);
      if (!existImage)
        throw new BadRequestException(this.resMessages.imageNotFound);
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const { imageUrl: oldImageUrl } = family;

      family.imageUrl = imageUrl !== undefined ? imageUrl : oldImageUrl;

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

      this.errorHandleProvider.handle(error);
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
        throw new NotFoundException(this.resMessages.familyNotHaveMembers);

      return members;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  async getMember_by_id(id: string) {
    try {
      const member = await this.familyMemberRepository.findOneBy({
        id,
      });

      if (!member) throw new NotFoundException(this.resMessages.memberNotFound);

      return member;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  async getMember_by_IdAndFamily(
    userId: string,
    familyId: string,
  ): Promise<FamilyMember> {
    return await this.familyMemberRepository.findOneBy({ userId, familyId });
  }

  async isMemberOfThisFamily(
    userId: string,
    familyId: string,
  ): Promise<boolean> {
    return !!(await this.getMember_by_IdAndFamily(userId, familyId));
  }

  async isMemberOfAnyFamily(userId: string): Promise<FamilyMember> {
    return await this.familyMemberRepository.findOneBy({ userId });
  }

  async changeRoleMember(
    memberId: string,
    updateRoleMemberDto: UpdateRoleMemberDto,
    { user, userFamilyMember }: Omit<AllUserData, 'userFamily'>,
  ) {
    if (updateRoleMemberDto.role == FamilyRoles.ouwner)
      throw new BadRequestException(this.resMessages.userForbidden);

    const member = await this.getMember_by_id(memberId);

    // que el usuario no se cambie el rol a si mismo
    if (member.userId == user.id)
      throw new ForbiddenException(this.resMessages.userForbidden);

    // ver si es de la misma familia
    // el usuario ouwner pertenece a esta familia?
    if (member.familyId != userFamilyMember.familyId)
      throw new ForbiddenException(this.resMessages.userForbiddenToFamily);

    try {
      member.role = updateRoleMemberDto.role;

      await this.familyMemberRepository.save(member);

      return member;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  async deleteMemberFamily(
    memberId: string,
    { user, userFamilyMember }: Omit<AllUserData, 'userFamily'>,
  ) {
    const { role, familyId } = userFamilyMember;

    const member = await this.getMember_by_id(memberId);

    // si no es el dueño solo puede eliminarse a si mismo
    if (role != FamilyRoles.ouwner) {
      if (user.id != member.userId)
        throw new ForbiddenException(this.resMessages.userForbidden);

      const result = await this.familyMemberRepository.delete({ id: memberId });
      return { success: !!result.affected };
    }

    // es de la misma familia?
    if (familyId != member.familyId)
      throw new ForbiddenException(this.resMessages.userUnauthorizedToFamily);

    if (user.id == member.userId)
      throw new ForbiddenException(this.resMessages.userForbidden);

    try {
      const result = await this.familyMemberRepository.delete({ id: memberId });

      return { success: !!result.affected };
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  // ************************************************************
  //                      invitaciones
  // ************************************************************

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

    const emailsAlreadyMember = (
      await this.familyMemberRepository.find({
        where: { user: { email: In(guestEmailsToSave) }, familyId: family.id },
        relations: { user: true },
        select: { user: { email: true } },
      })
    ).map((i) => i.user.email);

    guestEmailsToSave = guestEmailsToSave.filter((email) => {
      const isMember = emailsAlreadyMember.includes(email);

      if (isMember) resultInvitations.notInvited.alreadyMember.push(email);

      return !isMember;
    });

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
        message: this.resMessages.notUserToInvite,
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
      this.errorHandleProvider.handle(error);
    }
  }

  async getInvitation_by_id(id: string): Promise<FamilyMemberInvitation> {
    const invitation = await this.familyMemberInvitationRepository.findOneBy({
      id,
    });

    if (!invitation)
      throw new NotFoundException(this.resMessages.invitationNotFound);

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

  async acceptInvitation(invitationId: string, user: User) {
    const invitation = await this.getInvitation_by_id(invitationId);
    const { guestEmail, familyId, role } = invitation;

    if (guestEmail != user.email)
      throw new ForbiddenException(this.resMessages.userForbidden);

    const isMember = await this.isMemberOfAnyFamily(user.id);
    if (isMember)
      throw new BadRequestException(
        isMember.familyId == familyId
          ? this.resMessages.isAlreadyMember
          : this.resMessages.memberHasOtherFamily,
      );

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      invitation.status = FamilyMemberInvitationStatus.acepted;
      await queryRunner.manager.save(invitation);

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

      this.errorHandleProvider.handle(error);
    }
  }

  async rejecteInvitation(invitationId: string, user: User) {
    const { email } = user;

    const invitation = await this.getInvitation_by_id(invitationId);

    if (invitation.status != FamilyMemberInvitationStatus.pending)
      throw new BadRequestException(this.resMessages.invitationIsNotActive);

    if (email != invitation.guestEmail)
      throw new ForbiddenException(this.resMessages.userForbidden);

    try {
      invitation.status = FamilyMemberInvitationStatus.rejected;

      await this.familyMemberInvitationRepository.save(invitation);

      return invitation;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }

  async cancelInvitation(invitationId: string, family: Family) {
    const invitation = await this.getInvitation_by_id(invitationId);

    if (invitation.status != FamilyMemberInvitationStatus.pending)
      throw new BadRequestException(this.resMessages.invitationIsNotActive);

    if (invitation.familyId != family.id)
      throw new ForbiddenException(this.resMessages.userForbidden);

    try {
      invitation.status = FamilyMemberInvitationStatus.canceled;

      await this.familyMemberInvitationRepository.save(invitation);

      return invitation;
    } catch (error) {
      this.errorHandleProvider.handle(error);
    }
  }
}
