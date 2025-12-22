import { Module } from '@nestjs/common';
import { SentryScheduler } from './sentry.scheduler';
import { SentryService } from './sentry.service';
import { StorageModule } from './storage/storage.module';
import { AdminModule } from './admin/admin.module';
import { HeartbeatModule } from './heartbeat/heartbeat.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [HeartbeatModule, StorageModule, NotificationModule, AdminModule],
  providers: [SentryScheduler, SentryService],
})
export class SentryModule {}
