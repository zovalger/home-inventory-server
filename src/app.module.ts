import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvConfiguration } from './config/app.config';
import { JoiValidationsSchema } from './config/joi.validation';

import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { EmailModule } from './email/email.module';
import { FilesModule } from './files/files.module';
import { InventoryModule } from './inventory/inventory.module';
import { CompanyModule } from './company/company.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // envFilePath: ['.env.test.local'],
      load: [EnvConfiguration],
      validationSchema: JoiValidationsSchema,
    }),

    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: +process.env.DB_PORT,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,

      autoLoadEntities: process.env.NODE_ENV != 'production',
      synchronize: process.env.NODE_ENV != 'production',
    }),

    EmailModule,

    AuthModule,

    CommonModule,

    FilesModule,

    InventoryModule,

    CompanyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
