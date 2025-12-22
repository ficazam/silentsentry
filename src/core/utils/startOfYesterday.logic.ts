export const startOfYesterdayInTz = (tz: string): Date => {
  const now = new Date();

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);

  const y = Number(parts.find((p) => p.type === 'year')!.value);
  const m = Number(parts.find((p) => p.type === 'month')!.value);
  const d = Number(parts.find((p) => p.type === 'day')!.value);

  const startOfToday = new Date(Date.UTC(y, m - 1, d));

  startOfToday.setUTCDate(startOfToday.getUTCDate() - 1);

  return startOfToday;
};
