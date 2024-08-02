import { Injectable } from '@nestjs/common';

@Injectable()
export class FilesService {
  async upload(file: Express.Multer.File) {
    // const resizeImage = await sharp(file.buffer)
    //   .resize({
    //     height: 320,
    //     width: 320,
    //     fit: 'contain',
    //   })
    //   .webp()
    //   .toBuffer();

    // console.log(file);

    // console.log(resizeImage);

    return 'This action adds a new file';
  }
}
