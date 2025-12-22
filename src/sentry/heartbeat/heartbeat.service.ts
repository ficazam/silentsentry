import { Injectable } from '@nestjs/common';
import { MonitoredTarget, ProbeOutcome } from 'src/core/types';
import { request } from 'undici';

@Injectable()
export class HeartbeatService {
  async probe(target: MonitoredTarget): Promise<ProbeOutcome> {
    const url = target.url;

    if (!url)
      return {
        ok: false,
        statusCode: null,
        latencyMs: 0,
        error: 'Missing target.url',
      };

    const method = target.method ?? 'GET';
    const timeout = target.timeoutMs ?? 5000;
    const start = Date.now();

    const headers = {
      'user-agent': 'SilentSentry/1.0 (+https://www.felipeicaza.dev)',
      accept:
        'text/html,application/xhtml+xml,application/json;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
      'cache-control': 'no-cache',
      pragma: 'no-cache',
      ...(target.headers ?? {}),
    };

    try {
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), timeout);

      const response = await request(url, {
        method,
        headers,
        signal: controller.signal,
      });

      clearTimeout(t);

      let bodySnippet = '';

      try {
        const text = await response.body.text();
        bodySnippet = text.slice(0, 10);
      } catch (error) {}

      const latency = Date.now() - start;
      const statusCode = response.statusCode;
      const ok = statusCode >= 200 && statusCode < 300;

      return { ok, statusCode, latencyMs: latency, error: null, bodySnippet };
    } catch (error: any) {
      const latency = Date.now() - start;
      const msg =
        error.name === 'AbortError'
          ? 'Timeout'
          : (error.message ?? 'Unknown Error');

      return {
        ok: false,
        statusCode: null,
        latencyMs: latency,
        error: msg,
      };
    }
  }
}
