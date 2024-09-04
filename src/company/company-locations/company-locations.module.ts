import { Module } from '@nestjs/common';
import { CompanyLocationsService } from './company-locations.service';
import { CompanyLocationsController } from './company-locations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyLocation } from './entities';

@Module({
  imports: [TypeOrmModule.forFeature([CompanyLocation])],
  controllers: [CompanyLocationsController],
  providers: [CompanyLocationsService],
  exports: [CompanyLocationsService],
})
export class CompanyLocationsModule {}
