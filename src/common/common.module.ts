import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import {
  ErrorHandleProvider,
  ResMessages,
  ResponseBodyFormat,
} from './providers';

@Module({
  imports: [ConfigModule],
  providers: [ResMessages, ErrorHandleProvider, ResponseBodyFormat],
  exports: [ResMessages, ErrorHandleProvider, ResponseBodyFormat],
})
export class CommonModule {}
