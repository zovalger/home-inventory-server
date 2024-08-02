import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FilesService } from './files.service';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  //todo: validar que el archivo no sea mayor a 480px
  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    return this.filesService.upload(file);
  }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.filesService.remove(+id);
  // }
}
