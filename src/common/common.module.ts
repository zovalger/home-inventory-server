import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ErrorHandleProvider, ResMessages } from './providers';

@Module({
  imports: [ConfigModule],
  providers: [ResMessages, ErrorHandleProvider],
  exports: [ResMessages, ErrorHandleProvider],
})
export class CommonModule {}
