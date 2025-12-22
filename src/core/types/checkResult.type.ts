import { TargetStatus } from './targetStatus.type';

export type CheckResult = {
  targetId: string;
  timestamp: Date;
  status: TargetStatus;
  statusCode: number | null;
  latencyMs: number;
  errorMessage?: string | null;
  meta?: { bodySnippet?: string };
};
