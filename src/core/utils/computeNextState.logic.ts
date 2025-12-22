import { CheckResult, TargetState } from '../types';

export const computeNextState = (
  prev: TargetState | null,
  result: CheckResult,
): TargetState => {
  const now = new Date();

  if (!prev) {
    return {
      targetId: result.targetId,
      lastStatus: result.status,
      lastChangedAt: now,
      lastCheckedAt: now,
      lastLatencyMs: result.latencyMs,
      lastStatusCode: result.statusCode,
      lastError: result.errorMessage,
      consecutiveFailures: result.status === 'DOWN' ? 1 : 0,
      lastAlertAt: null,
      updatedAt: now,
    };
  }

  const changed = prev.lastStatus !== result.status;
  const consecutiveFailures =
    result.status === 'DOWN' ? (prev.consecutiveFailures ?? 0) + 1 : 0;

  return {
    ...prev,
    lastStatus: result.status,
    lastChangedAt: changed ? now : prev.lastChangedAt,
    lastCheckedAt: now,
    lastLatencyMs: result.latencyMs,
    lastStatusCode: result.statusCode,
    lastError: result.errorMessage,
    consecutiveFailures,
    updatedAt: now,
  };
};
