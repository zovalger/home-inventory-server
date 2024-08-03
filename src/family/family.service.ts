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
import { ResMessages } from 'src/config/res-messages';

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
