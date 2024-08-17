import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { isUUID } from 'class-validator';

import { User } from '../auth/entities';
import { File } from './entities';

import { CloudinaryService } from './cloudinary/cloudinary.service';
import { ResMessages } from '../common/providers';

@Injectable()
export class FilesService {
  constructor(
    private readonly resMessages: ResMessages,
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
  ) {}

  async upload(user: User, fileToUpload: Express.Multer.File) {
    const { public_id, secure_url } =
      await this.cloudinaryService.uploadFile(fileToUpload);

    const file = this.fileRepository.create({
      createBy: user,
      type: 'image',
      serviceId: public_id,
      url: secure_url,
    });

    await this.fileRepository.save(file);

    return { url: file.url };
  }

  async getImage(term: string): Promise<File> {
    const file = isUUID(term)
      ? await this.fileRepository.findOneBy({ id: term })
      : await this.fileRepository.findOneBy({ url: term });

    if (!file) throw new NotFoundException(this.resMessages.imageNotFound);

    return file;
  }

  async existImageInDB(url: string): Promise<boolean> {
    return !!(await this.fileRepository.countBy({ url }));
  }

  async deleteImage(term: string, user: User) {
    const file = await this.getImage(term);

    if (file.createById != user.id)
      throw new ForbiddenException(this.resMessages.userForbidden);

    try {
      await this.cloudinaryService.deleteFile(file.serviceId);
      await this.fileRepository.delete(file);
    } catch (error) {
      console.log(error);
    }
  }

  async deleteUserImageByQueryRunner(queryRunner: QueryRunner, url: string) {
    const isUsed = await queryRunner.manager.count(User, {
      where: { imageUrl: url },
    });

    if (!isUsed) await this.deleteImageByQueryRunner(queryRunner, url);
  }

  async deleteImageByQueryRunner(queryRunner: QueryRunner, url: string) {
    const file = await this.getImage(url);

    try {
      this.cloudinaryService.deleteFile(file.serviceId);
      await queryRunner.manager.delete(File, { url });
    } catch (error) {
      console.log(error);
    }
  }
}
