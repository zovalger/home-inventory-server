import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { AuthModule } from 'src/auth/auth.module';
import { FilesModule } from 'src/files/files.module';

import { FamilyService } from './family.service';
import { FamilyController } from './family.controller';
import { Family, FamilyMember, FamilyMemberInvitation } from './entities';
import { EmailModule } from 'src/email/email.module';

@Module({
  imports: [
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
