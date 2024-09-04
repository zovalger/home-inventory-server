import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  CreateQueryRunner,
  ErrorHandleProvider,
  ResMessages,
  ResponseBodyFormat,
} from './providers';

@Module({
  imports: [ConfigModule],
  providers: [
    ResMessages,
    ErrorHandleProvider,
    ResponseBodyFormat,
    CreateQueryRunner,
  ],
  exports: [
    ResMessages,
    ErrorHandleProvider,
    ResponseBodyFormat,
    CreateQueryRunner,
  ],
})
export class CommonModule {}
