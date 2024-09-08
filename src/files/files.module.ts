import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { File } from './entities';

import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { FilesService } from './files.service';
import { FilesController } from './files.controller';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => AuthModule),
    // forwardRef(() => FamilyModule),
    CloudinaryModule,
    TypeOrmModule.forFeature([File]),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [TypeOrmModule, FilesService],
})
export class FilesModule {}
