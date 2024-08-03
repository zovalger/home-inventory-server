import { Injectable } from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { User } from 'src/auth/entities';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { File } from './entities';
import { isUUID } from 'class-validator';

@Injectable()
export class FilesService {
  constructor(
    private readonly cloudinaryService: CloudinaryService,
    @InjectRepository(File)
    private readonly fileRepository: Repository<File>,
    private readonly dataSource: DataSource,
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

    return file;
  }

  async existImageInDB(url: string): Promise<boolean> {
    return !!(await this.fileRepository.countBy({ url }));
  }
  async deleteImage(term: string) {
    const file = await this.getImage(term);

    if (file) await this.fileRepository.delete(file);
  }

  async deleteImageByQueryRunner(queryRunner: QueryRunner, url: string) {
    await queryRunner.manager.delete(File, { url });
  }

  async deleteUserImageByQueryRunner(queryRunner: QueryRunner, url: string) {
    const isUsed = await queryRunner.manager.count(User, {
      where: { imageUrl: url },
    });

    if (!isUsed) await this.deleteImageByQueryRunner(queryRunner, url);
  }
}
