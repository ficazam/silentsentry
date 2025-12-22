import { TargetStatus } from './targetStatus.type';

export type TargetState = {
  targetId: string;
  lastStatus: TargetStatus;
  lastChangedAt: Date;
  lastCheckedAt: Date | null;
  lastLatencyMs: number | null;
  lastStatusCode: number | null;
  lastError?: string | null;
  lastDownAlertDate?: string | null,
  lastStatusAlertDate?: string | null,
  consecutiveFailures: number;
  lastAlertAt: Date | null;
  updatedAt: Date;
};
