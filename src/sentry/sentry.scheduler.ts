import { Injectable, Logger } from '@nestjs/common';
import { FirestoreStorage } from './storage/firestore.storage';
import { SentryService } from './sentry.service';
import { Cron, Interval } from '@nestjs/schedule';
import { isDue } from 'src/core/utils';
import { MonitoredTarget } from 'src/core/types';
import { startOfYesterdayInTz } from 'src/core/utils/startOfYesterday.logic';

@Injectable()
export class SentryScheduler {
  private readonly logger = new Logger(SentryScheduler.name);

  private running = false;

  constructor(
    private readonly storage: FirestoreStorage,
    private readonly sentry: SentryService,
  ) {}

  @Interval(1000 * 60 * 60)
  async tick(): Promise<void> {
    if (this.running) return;
    this.running = true;

    try {
      const now = new Date();
      const targets = await this.storage.listEnabledTargets();

      const maxConcurrency = Math.max(
        1,
        Number(process.env.SENTRY_MAX_CONCURRENCY ?? 4),
      );

      const due: MonitoredTarget[] = [];

      for (const t of targets) {
        const state = await this.storage.getTargetState(t.id);

        const dueNow = isDue(t, state, now);
        this.logger.log(`isDue(${t.id}) = ${dueNow}`);

        if (dueNow) due.push(t);
      }

      for (let i = 0; i < due.length; i += maxConcurrency) {
        const batch = due.slice(i, i + maxConcurrency);
        await Promise.all(batch.map((t) => this.sentry.runTargetCheck(t)));
      }
    } catch (e: any) {
      this.logger.error(`Tick failed: ${e?.message ?? e}`);
    } finally {
      this.running = false;
    }
  }

  @Cron('0 0 * * * *', {
    timeZone: process.env.SENTRY_TIMEZONE ?? 'America/Panama',
  })
  async dailySummary(): Promise<void> {
    try {
      await this.sentry.sendDailySummary();
      const tz = process.env.SENTRY_TIMEZONE ?? 'America/Panama';
      const cutoff = startOfYesterdayInTz(tz);

      const deleted = await this.storage.deleteCheckResultsBefore(cutoff);
      this.logger.log(
        `Deleted ${deleted} checkResults before ${cutoff.toISOString()}`,
      );
    } catch (e: any) {
      this.logger.error(`Daily summary failed: ${e?.message ?? e}`);
    }
  }
}
