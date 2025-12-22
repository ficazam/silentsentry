import { MonitoredTarget, NotifyDecision, TargetState } from '../types';
import { dateKeyInTz } from './dateKeyToTz.logic';

export const shouldNotify = (
  target: MonitoredTarget,
  prev: TargetState | null,
  next: TargetState,
  now: Date,
  tz: string,
): NotifyDecision => {
  if (!prev) {
    if (next.lastStatus === 'DOWN') {
      return {
        should: true,
        kind: 'DOWN',
        transition: 'UNKNOWN → DOWN',
      };
    }

    return { should: false };
  }

  const changed = prev.lastStatus !== next.lastStatus;
  if (!changed) return { should: false };

  if (next.lastStatus === 'UP') {
    return {
      should: true,
      kind: 'RECOVERY',
      transition: `${prev.lastStatus} → UP`,
    };
  }

  const todayKey = dateKeyInTz(now, tz);

  const alreadyAlertedToday = prev.lastDownAlertDate === todayKey;
  if (alreadyAlertedToday) return { should: false };

  if (next.lastStatus === 'DOWN') {
    return {
      should: true,
      kind: 'DOWN',
      transition: `${prev.lastStatus} → DOWN`,
    };
  }

  if (next.lastStatus === 'DEGRADED') {
    return {
      should: true,
      kind: 'DEGRADED',
      transition: `${prev.lastStatus} → DEGRADED`,
    };
  }

  return { should: false };
};
