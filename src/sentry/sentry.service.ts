import { Injectable, Logger } from '@nestjs/common';
import { FirestoreStorage } from './storage/firestore.storage';
import { HeartbeatService } from './heartbeat/heartbeat.service';
import { NotificationService } from './notification/notification.service';
import { MonitoredTarget, NotificationItem } from 'src/core/types';
import {
  computeNextState,
  dateKeyInTz,
  evaluateOutcome,
  hasItBeenADay,
  shouldNotify,
} from 'src/core/utils';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  constructor(
    private readonly storage: FirestoreStorage,
    private readonly probe: HeartbeatService,
    private readonly notifications: NotificationService,
  ) {}

  async runTargetCheck(target: MonitoredTarget): Promise<void> {
    this.logger.log(
      `runTargetCheck START ${target.id} kind=${target.type} url=${target.url}`,
    );

    if (target.type !== 'HTTP') return;

    const prev = await this.storage.getTargetState(target.id);
    const outcome = await this.probe.probe(target);
    const result = evaluateOutcome(target, outcome);
    const next = computeNextState(prev, result);

    await this.storage.insertCheckResult(result);
    await this.storage.upsertTargetState(next);
    const tz = process.env.SENTRY_TIMEZONE ?? 'America/Panama';
    const todayKey = dateKeyInTz(new Date(), tz);

    const decision = shouldNotify(target, prev, next, new Date(), tz);

    if (decision.should) {
      try {
        await this.notifications.setIncidentAlert({
          target,
          prev,
          next,
          transition: decision.transition,
          kind: decision.kind,
        });

        if (decision.kind === 'DOWN' || decision.kind === 'DEGRADED') {
          await this.storage.updateTargetStateFields(target.id, {
            lastDownAlertDate: todayKey,
          });
        }
      } catch (error) {
        this.logger.error(
          `Discord notification failed for ${target.name} - ${error.message ?? error}`,
        );
      }
    }
  }

  async sendDailySummary(): Promise<void> {
    const targets = await this.storage.listEnabledTargets();
    const since = hasItBeenADay(new Date());

    const items: NotificationItem[] = [];

    for (const target of targets) {
      const results = await this.storage.getResultsForTargetSince(
        target.id,
        since,
      );
      const checks = results.length;
      const downs = results.filter((r) => r.status === 'DOWN').length;
      const degraded = results.filter((r) => r.status === 'DEGRADED').length;
      const up = results.filter((r) => r.status === 'UP').length;

      const uptimePct = checks > 0 ? (up / checks) * 100 : 0;
      const avgLatency =
        checks > 0
          ? results.reduce((sum, r) => sum + (r.latencyMs ?? 0), 0) / checks
          : 0;

      const last = results.at(-1);

      items.push({
        target,
        uptimePct,
        checks,
        downs,
        degraded,
        avgLatency,
        lastStatus: checks === 0 ? 'NO_DATA' : (last?.status ?? 'UNKNOWN'),
        lastError: last?.errorMessage ?? null,
      });
    }

    await this.notifications.sendDaily({ when: new Date(), items });
  }
}
