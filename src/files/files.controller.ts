import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';

import { FilesService } from './files.service';

import { User } from '../auth/entities';
import { Auth, GetUser } from '../auth/decorators';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  //todo: validar que el archivo no sea mayor a 480px
  @Post('upload')
  @Auth({ withoutFamilyMember: true })
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(
    @GetUser() user: User,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.filesService.upload(user, file);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.filesService.remove(+id);
  // }
}
