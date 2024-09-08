import { Module } from '@nestjs/common';
import { CompanyLocationsService } from './company-locations.service';
import { CompanyLocationsController } from './company-locations.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyLocation } from './entities';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [AuthModule, TypeOrmModule.forFeature([CompanyLocation])],
  controllers: [CompanyLocationsController],
  providers: [CompanyLocationsService],
  exports: [CompanyLocationsService],
})
export class CompanyLocationsModule {}
