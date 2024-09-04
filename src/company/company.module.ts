import { Module } from '@nestjs/common';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Company } from './entities';
import { CompanyLocationsModule } from './company-locations/company-locations.module';

@Module({
  imports: [TypeOrmModule.forFeature([Company]), CompanyLocationsModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [TypeOrmModule, CompanyService],
})
export class CompanyModule {}
