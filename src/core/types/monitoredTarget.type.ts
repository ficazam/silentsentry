export type MonitoredTarget = {
  id: string;
  name: string;
  type: 'HTTP' | 'HEARTBEAT';
  url?: string;
  interval: number;
  method?: 'POST' | 'GET' | 'HEAD';
  timeoutMs?: number;
  headers?: Record<string, string>;
  bodyContains?: string;
  expectedStatus?: number;
  latencyDegradedMs?: number;
  alertCooldownSeconds?: number;
  notifyOnDegraded?: boolean;
  notifyOnRecovery?: boolean;
  createdAt?: any;
  updatedAt?: any;
  enabled: boolean;
};
