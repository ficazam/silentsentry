import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MonitoredTarget, NotificationItem, TargetState } from 'src/core/types';
import { formatDuration } from 'src/core/utils';
import { request } from 'undici';

@Injectable()
export class NotificationService {
  private webhookUrl: string;

  constructor(private readonly config: ConfigService) {
    const url = this.config.get<string>('DISCORD_WEBHOOK_URL');
    if (!url) throw new Error('DISCORD_WEBHOOK_URL is required');
    this.webhookUrl = url;
  }

  async setIncidentAlert(args: {
    target: MonitoredTarget;
    prev: TargetState | null;
    next: TargetState;
    transition: string;
    kind: string;
  }): Promise<void> {
    const { target, prev, next, transition, kind } = args;
    const now = Date.now();
    const downtime =
      prev && prev.lastStatus === 'UP' && next.lastStatus !== 'UP'
        ? 0
        : prev && prev.lastStatus === 'DOWN' && next.lastStatus === 'UP'
          ? now - prev.lastChangedAt?.getTime()
          : 0;

    const title =
      next.lastStatus === 'DOWN'
        ? `🔴 DOWN: ${target.name}`
        : next.lastStatus === 'DEGRADED'
          ? `🟠 DEGRADED: ${target.name}`
          : `🟢 RECOVERED: ${target.name}`;

    const lines: string[] = [];

    if (target.url) lines.push(`**URL:** ${target.url}`);
    lines.push(`**Transition:** ${transition}`);
    lines.push(`**Reason:** ${kind}`);
    if (next.lastStatusCode != null)
      lines.push(`**Status Code:** ${next.lastStatusCode}`);
    if (next.lastLatencyMs != null)
      lines.push(`**Latency:** ${next.lastLatencyMs}ms`);
    if (next.lastError) lines.push(`**Error:** ${next.lastError}`);
    if (downtime > 0) lines.push(`**Downtime:** ${formatDuration(downtime)}`);

    await this.post({
      content: title,
      embeds: [{ title, description: lines.join('\n') }],
    });
  }

  async sendDaily(args: {
    when: Date;
    items: NotificationItem[];
  }): Promise<void> {
    const { when, items } = args;

    const header = `📊 Daily Summary (${when.toLocaleDateString('en-US')})`;

    const description =
      items.length === 0
        ? 'No enabled targets found.'
        : items
            .map((x) => {
              const parts = [
                `**${x.target.name}** — ${x.lastStatus}`,
                `Uptime: ${x.uptimePct.toFixed(1)}%`,
                `Checks: ${x.checks}`,
                `Down: ${x.downs}`,
                `Degraded: ${x.degraded}`,
                `Avg Latency: ${Math.round(x.avgLatency)}ms`,
              ];
              if (x.lastError) parts.push(`Last error: ${x.lastError}`);
              return parts.join(' | ');
            })
            .join('\n');

    await this.post({
      content: header,
      embeds: [{ title: header, description }],
    });
  }

  private async post(payload: any): Promise<void> {
    await request(this.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
  }
}
