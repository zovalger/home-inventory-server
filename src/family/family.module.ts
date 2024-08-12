import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Family, FamilyMember, FamilyMemberInvitation } from './entities';

import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { EmailModule } from '../email/email.module';
import { CommonModule } from '../common/common.module';

import { FamilyController } from './family.controller';
import { FamilyService } from './family.service';

@Module({
  imports: [
    CommonModule,
    forwardRef(() => AuthModule),
    forwardRef(() => FilesModule),

    TypeOrmModule.forFeature([Family, FamilyMember, FamilyMemberInvitation]),

    EmailModule,
  ],
  controllers: [FamilyController],
  providers: [FamilyService],
  exports: [TypeOrmModule, FamilyService],
})
export class FamilyModule {}
