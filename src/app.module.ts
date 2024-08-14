import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import { EnvConfiguration } from './config/app.config';
import { JoiValidationsSchema } from './config/joi.validation';

import { AuthModule } from './auth/auth.module';
import { CommonModule } from './common/common.module';
import { EmailModule } from './email/email.module';
import { FilesModule } from './files/files.module';
import { FamilyModule } from './family/family.module';
import { InventoryModule } from './inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [EnvConfiguration],
      validationSchema: JoiValidationsSchema,
    }),

    TypeOrmModule.forRoot(
      process.env.NODE_ENV == 'production'
        ? {
            type: 'postgres',
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            username: process.env.DB_USERNAME,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
          }
        : {
            type: 'postgres',
            host: process.env.TEST_DB_HOST,
            port: +process.env.TEST_DB_PORT,
            username: process.env.TEST_DB_USERNAME,
            password: process.env.TEST_DB_PASSWORD,
            database: process.env.TEST_DB_NAME,

            autoLoadEntities: true,
            synchronize: true,
          },
    ),

    EmailModule,

    AuthModule,

    CommonModule,

    FilesModule,

    FamilyModule,

    InventoryModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
