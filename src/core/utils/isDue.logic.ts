import { MonitoredTarget, TargetState } from '../types';

export const isDue = (
  target: MonitoredTarget,
  state: TargetState | null,
  now = new Date(),
): boolean => {
  if (!target.enabled) return false;

  const interval = Math.max(15, target.interval || 60);

  if (!state?.lastCheckedAt) return true;

  const last = state.lastCheckedAt.getTime();
  const diff = (now.getTime() - last) / 1000;

  return diff >= interval;
};
