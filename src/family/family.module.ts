import { Module, forwardRef } from '@nestjs/common';
import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Family, FamilyMember } from './entities';
import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';

@Module({
  imports: [
    forwardRef(() => AuthModule),
    forwardRef(() => FilesModule),
    TypeOrmModule.forFeature([Family, FamilyMember]),
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [TypeOrmModule, FamilyService],
})
export class FamilyModule {}
