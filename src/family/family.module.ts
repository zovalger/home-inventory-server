import { Module } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family } from './entities';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [AuthModule, FilesModule, TypeOrmModule.forFeature([Family])],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [TypeOrmModule, FamilyService],
})
export class FamilyModule {}
