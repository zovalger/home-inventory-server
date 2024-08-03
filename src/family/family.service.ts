import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateFamilyDto } from './dto/create-family.dto';
import { UpdateFamilyDto } from './dto/update-family.dto';
import { User } from 'src/auth/entities';
import { Family, FamilyMember } from './entities';
import { DataSource, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { FilesService } from 'src/files/files.service';
import { FamilyRoles } from './interfaces';

@Injectable()
export class FamilyService {
  constructor(
    @InjectRepository(Family)
    private readonly familyRepository: Repository<Family>,
    @InjectRepository(FamilyMember)
    private readonly familyMemberRepository: Repository<FamilyMember>,

    private readonly filesService: FilesService,
    private readonly dataSource: DataSource,
  ) {}

  async create(user: User, createFamilyDto: CreateFamilyDto) {
    const member = await this.familyMemberRepository
      .createQueryBuilder()
      .where('"userId"=:userId', { userId: user.id })
      .getOne();

    if (member)
      throw new BadRequestException('The user already has a family group');

    if (!createFamilyDto.name)
      createFamilyDto.name = user.lastName ? user.lastName : user.name;

    const imageFile = createFamilyDto.image
      ? await this.filesService.getImage(createFamilyDto.image)
      : undefined;

    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // todo: crear familia

      const family = this.familyRepository.create({
        ...createFamilyDto,
        createBy: user,
        image: imageFile,
      });

      await queryRunner.manager.save(family);

      // todo: crear miembro ouwner
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

  async myFamily(user: User) {
    try {
      const family = await this.familyRepository.findOne({
        where: { members: { userId: user.id } },
        relations: { members: { user: true } },
      });

      return family;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  async update(id: string, updateFamilyDto: UpdateFamilyDto, user: User) {
    const imageFile = updateFamilyDto.image
      ? await this.filesService.getImage(updateFamilyDto.image)
      : undefined;

    try {
      const family = await this.familyRepository.preload({
        id,
        ...updateFamilyDto,
        image: imageFile,
      });

      await this.familyRepository.save(family);

      return family;
    } catch (error) {
      this.handleDBError(error);
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} family`;
  }

  remove(id: number) {
    return `This action removes a #${id} family`;
  }

  // async doesUserHaveaFamily() {}

  handleDBError(error: any) {
    if (error.code == '23505')
      throw new BadRequestException('Is already register');

    if (error.status == 404) throw new NotFoundException(error.response);

    console.log(error);
    throw new InternalServerErrorException('Check server logs');
  }
}
