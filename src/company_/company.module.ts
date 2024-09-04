import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Company, CompanyLocation } from '../company/entities';

import { AuthModule } from '../auth/auth.module';
import { FilesModule } from '../files/files.module';
import { EmailModule } from '../email/email.module';
import { CommonModule } from '../common/common.module';



@Module({
  imports: [
    CommonModule,
    AuthModule,
    FilesModule,
    // forwardRef(() => FilesModule),

    TypeOrmModule.forFeature([Company, CompanyLocation]),

    EmailModule,
  ],
  controllers: [Companyc],
  providers: [FamilyService],
  exports: [TypeOrmModule, FamilyService],
})
export class FamilyModule {}
