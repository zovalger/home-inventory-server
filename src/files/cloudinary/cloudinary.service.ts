import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { DeleteApiResponse, UploadApiResponse, v2 } from 'cloudinary';

@Injectable()
export class CloudinaryService {
  async uploadFile(
    file: Express.Multer.File,
    folder = 'home_storage',
  ): Promise<UploadApiResponse> {
    return await new Promise((resolve, reject) =>
      v2.uploader
        .upload_stream({ folder }, (error, result) => {
          if (error) {
            reject(error);
            throw new InternalServerErrorException(error);
          }

          resolve(result);
        })
        .end(file.buffer),
    );
  }

  async uploadFileByPath(filePath: string, folder = 'home_storage') {
    return await v2.uploader.upload(filePath, { folder });
  }

  async deleteFile(cloudinary_public_Id: string): Promise<DeleteApiResponse> {
    return await v2.uploader.destroy(cloudinary_public_Id);
  }
}
