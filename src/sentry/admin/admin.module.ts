import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { StorageModule } from '../storage/storage.module';
import { AdminTargetsController } from './admin.controller';
import { AdminGuard } from './admin.guard';

@Module({
  imports: [ConfigModule, StorageModule],
  controllers: [AdminTargetsController],
  providers: [AdminGuard],
})
export class AdminModule {}
