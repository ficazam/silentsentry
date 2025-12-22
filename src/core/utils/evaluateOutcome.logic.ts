import {
  CheckResult,
  MonitoredTarget,
  ProbeOutcome,
  TargetStatus,
} from '../types';

export const evaluateOutcome = (
  target: MonitoredTarget,
  outcome: ProbeOutcome,
): CheckResult => {
  const expected = target.expectedStatus ?? 200;
  const timeout = target.timeoutMs ?? 5000;

  let status: TargetStatus = 'UP';
  if (!outcome.ok) status = 'DOWN';
  if (outcome.statusCode === null) status = 'STALE';
  if (outcome.statusCode != null && outcome.statusCode !== expected)
    status = 'DOWN';

  if (status === 'UP' && target.bodyContains) {
    const body = outcome.bodySnippet ?? '';
    if (!body.includes(target.bodyContains)) status = 'DEGRADED';
  }

  if (status === 'UP' && target.latencyDegradedMs != null) {
    if (outcome.latencyMs > target.latencyDegradedMs) status = 'DEGRADED';
  }

  if (
    outcome.error?.toLowerCase().includes('timeout') &&
    outcome.statusCode !== null
  )
    status = 'DOWN';

  return {
    targetId: target.id,
    timestamp: new Date(),
    status,
    latencyMs: outcome.latencyMs ?? timeout,
    statusCode: outcome.statusCode,
    errorMessage: outcome.error,
    meta: { bodySnippet: outcome.bodySnippet ?? '' },
  };
};
