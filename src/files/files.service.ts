import { Injectable } from '@nestjs/common';
import { CloudinaryService } from './cloudinary/cloudinary.service';
import { User } from 'src/auth/entities';
import { DataSource, Repository } from 'typeorm';
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

  async deleteImage(id: string) {
    await this.fileRepository.delete({ id });
  }
}
