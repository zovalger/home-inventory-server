import { Module } from '@nestjs/common';
import { CompanyLocationsService } from './company-locations.service';
import { CompanyLocationsController } from './company-locations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyLocation } from './entities';
import { CompanyModule } from '../company/company.module';
import { AuthModule } from 'src/auth/auth.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  imports: [
    CommonModule,
    AuthModule,
    TypeOrmModule.forFeature([CompanyLocation]),
    CompanyModule,
  ],
  controllers: [CompanyLocationsController],
  providers: [CompanyLocationsService],
  exports: [CompanyLocationsService],
})
export class CompanyLocationsModule {}
