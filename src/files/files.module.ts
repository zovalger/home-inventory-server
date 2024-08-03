import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { FilesService } from './files.service';
import { FilesController } from './files.controller';
import { CloudinaryModule } from './cloudinary/cloudinary.module';
import { File } from './entities';
import { AuthModule } from 'src/auth/auth.module';
import { FamilyModule } from 'src/family/family.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => FamilyModule),
    CloudinaryModule,
    TypeOrmModule.forFeature([File]),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [TypeOrmModule, FilesService],
})
export class FilesModule {}
