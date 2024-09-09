import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities';
import { FilesModule } from 'src/files/files.module';
import { EmailModule } from 'src/email/email.module';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Company]),
    CommonModule,
    AuthModule,
    FilesModule,
    EmailModule,
  ],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [TypeOrmModule, CompanyService],
})
export class CompanyModule {}
