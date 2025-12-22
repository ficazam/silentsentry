import { MonitoredTarget } from './monitoredTarget.type';

export type NotificationItem = {
  target: MonitoredTarget;
  uptimePct: number;
  checks: number;
  downs: number;
  degraded: number;
  avgLatency: number;
  lastStatus: string;
  lastError?: string | null;
};
