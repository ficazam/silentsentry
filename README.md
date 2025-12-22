<html>
  <head>
    <meta charset="utf-8" />
    <title>Silent Sentry README</title>
    <style>
      body {
        font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto,
          Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
        line-height: 1.5;
        margin: 24px;
        color: #111;
      }
      code,
      pre {
        font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
          "Liberation Mono", "Courier New", monospace;
      }
      pre {
        padding: 14px;
        border-radius: 10px;
        background: #0b1020;
        color: #e8edff;
        overflow: auto;
      }
      h1,
      h2,
      h3 {
        margin-top: 26px;
      }
      .muted {
        color: #555;
      }
      .pill {
        display: inline-block;
        padding: 2px 10px;
        border-radius: 999px;
        background: #f2f4f8;
        margin-right: 6px;
        font-size: 12px;
      }
      ul {
        margin-top: 8px;
      }
      .callout {
        border-left: 4px solid #6b7cff;
        padding: 10px 14px;
        background: #f6f7ff;
        border-radius: 8px;
        margin: 14px 0;
      }
    </style>
  </head>

  <body>
    <h1>Silent Sentry 🛡️</h1>
    <p class="muted">
      A lightweight monitoring daemon that periodically checks your apps, writes
      state to Firestore, and sends Discord alerts + daily summaries.
    </p>

    <p>
      <span class="pill">NestJS</span>
      <span class="pill">@nestjs/schedule</span>
      <span class="pill">Firestore</span>
      <span class="pill">Discord Webhooks</span>
      <span class="pill">TypeScript</span>
    </p>

    <div class="callout">
      <strong>Design goal:</strong> signal &gt; noise.<br />
      One DOWN alert per target per day, immediate RECOVERED alerts, and a daily
      summary — without DB bloat.
    </div>

    <h2>Why this exists</h2>
    <p>
      Most personal monitoring setups either spam you, cost money over time, or
      depend on dashboards you don’t control. Silent Sentry is intentionally
      opinionated:
    </p>
    <ul>
      <li>✅ One DOWN alert per target per day (timezone-aware)</li>
      <li>✅ Immediate RECOVERED alert when service returns</li>
      <li>✅ Daily summary of all monitored targets</li>
      <li>✅ Rolling retention: keep only today + yesterday logs</li>
      <li>✅ Built to run as a single instance to avoid duplicate cron execution</li>
    </ul>

    <h2>Core features</h2>

    <h3>Monitoring</h3>
    <ul>
      <li>HTTP checks for frontends (static sites) and backends (APIs)</li>
      <li>
        Per-target configuration:
        <ul>
          <li><code>intervalSeconds</code></li>
          <li><code>expectedStatus</code></li>
          <li><code>timeoutMs</code></li>
          <li><code>bodyContains</code> (optional)</li>
          <li><code>latencyDegradedMs</code> (optional)</li>
        </ul>
      </li>
    </ul>

    <h3>Alerting</h3>
    <ul>
      <li>Discord webhook notifications</li>
      <li>Daily summary sent at a fixed local time (e.g., 09:00 Panama)</li>
    </ul>

    <h3>Persistence</h3>
    <ul>
      <li><code>targets</code>: what to monitor</li>
      <li><code>targetStates</code>: last known status + suppression metadata</li>
      <li><code>checkResults</code>: rolling logs for debugging + summaries</li>
    </ul>

    <h2>Alert policy (Signal &gt; Noise)</h2>
    <p>
      The whole point is to stop alert fatigue. Per target, per day (in your
      configured timezone):
    </p>
    <ul>
      <li>
        <strong>UP → DOWN</strong>: send 🔴 once, suppress additional DOWN alerts
        until tomorrow
      </li>
      <li>
        <strong>DOWN → UP</strong>: send 🟢 immediately (always), then stay quiet
      </li>
      <li>
        <strong>No “still down” spam</strong>: silence until recovery or the next
        day
      </li>
    </ul>

    <h2>Architecture</h2>
    <pre>
┌──────────────────┐        ┌──────────────────┐
│ Scheduler (Cron) │───────▶│ Sentry Service    │
│ hourly tick      │        │ orchestration     │
└───────┬──────────┘        └─────────┬────────┘
        │                               │
        ▼                               ▼
┌──────────────────┐            ┌──────────────────┐
│ Firestore         │◀──────────▶│ Probe Layer       │
│ targets/states    │            │ HTTP checks       │
│ checkResults      │            └─────────┬────────┘
└────────┬─────────┘                      │
         │                                 ▼
         │                         ┌──────────────────┐
         └────────────────────────▶│ Discord Notifier  │
                                   └──────────────────┘
</pre
    >

    <h2>Getting started (Local)</h2>

    <h3>Prerequisites</h3>
    <ul>
      <li>Node.js &gt;= 20</li>
      <li>Firebase project with Firestore enabled</li>
      <li>Discord webhook URL</li>
    </ul>

    <h3>Install</h3>
    <pre><code>npm ci</code></pre>

    <h3>Environment variables</h3>
    <p>Create a <code>.env</code> file:</p>
    <pre><code>DISCORD_WEBHOOK_URL=&lt;discord webhook&gt;
ADMIN_API_KEY=dev-secret

SENTRY_TIMEZONE=America/Panama
SENTRY_MAX_CONCURRENCY=1

# If using a Firebase service account file locally:
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase.json</code></pre>

    <h3>Run</h3>
    <pre><code>npm run start:dev</code></pre>

    <h2>Admin API (manage targets via HTTP)</h2>
    <p>
      All admin routes require the header:
      <code>x-admin-key: &lt;ADMIN_API_KEY&gt;</code>
    </p>

    <h3>Create a target</h3>
    <p><code>POST /admin/targets</code></p>

    <h4>Frontend example</h4>
    <pre><code>{
  "name": "Portfolio",
  "type": "HTTP",
  "enabled": true,
  "intervalSeconds": 3600,
  "url": "https://www.example.com",
  "method": "GET",
  "expectedStatus": 200,
  "timeoutMs": 7000,
  "alertCooldownSeconds": 86400,
  "notifyOnRecovery": true,
  "notifyOnDegraded": false
}</code></pre>

    <h4>Backend example</h4>
    <pre><code>{
  "name": "API Health",
  "type": "HTTP",
  "enabled": true,
  "intervalSeconds": 3600,
  "url": "https://api.example.com/health",
  "method": "GET",
  "expectedStatus": 200,
  "bodyContains": "ok",
  "timeoutMs": 5000,
  "alertCooldownSeconds": 86400,
  "notifyOnRecovery": true,
  "notifyOnDegraded": true
}</code></pre>

    <h3>Routes</h3>
    <ul>
      <li><code>GET /admin/targets</code></li>
      <li><code>GET /admin/targets/:id</code></li>
      <li><code>POST /admin/targets</code></li>
      <li><code>PATCH /admin/targets/:id</code></li>
      <li><code>DELETE /admin/targets/:id</code></li>
    </ul>

    <h2>Deployment (Render Web Service)</h2>
    <div class="callout">
      <strong>Important:</strong> Run exactly <strong>one</strong> instance in
      production. If you scale to multiple instances, cron will execute multiple
      times unless you implement a distributed lock.
    </div>

    <h3>Render settings</h3>
    <ul>
      <li><strong>Build command:</strong> <code>npm ci && npm run build</code></li>
      <li><strong>Start command:</strong> <code>node dist/main.js</code></li>
      <li><strong>Instances:</strong> 1 (disable autoscale)</li>
    </ul>

    <h3>Production env vars</h3>
    <pre><code>DISCORD_WEBHOOK_URL=...
ADMIN_API_KEY=...

SENTRY_TIMEZONE=America/Panama
SENTRY_MAX_CONCURRENCY=1

# Firebase service account secret file path (recommended)
FIREBASE_SERVICE_ACCOUNT_PATH=/etc/secrets/firebase.json</code></pre>

    <h2>How to verify it’s working (after deploy)</h2>
    <ol>
      <li>
        <strong>Hit the health endpoint:</strong>
        <code>GET /health</code> should return <code>{ "ok": true }</code>
      </li>
      <li>
        <strong>Check logs:</strong> you should see the hourly <code>tick ✅</code>
      </li>
      <li>
        <strong>Check Firestore:</strong> <code>targetStates/*</code> should update
        on schedule
      </li>
      <li>
        <strong>Force a failure test:</strong> temporarily set a target URL to a
        404:
        <ul>
          <li>Expect one 🔴 DOWN alert</li>
          <li>Set it back and expect 🟢 RECOVERED</li>
        </ul>
      </li>
    </ol>

    <h2>Roadmap</h2>
    <ul>
      <li>Distributed leader lock for safe horizontal scaling</li>
      <li>Status dashboard UI (read-only, no secrets)</li>
      <li>JSON-based health assertions (e.g., ok === true)</li>
      <li>Grouped summaries by app/environment</li>
      <li>Maintenance windows / scheduled silences</li>
    </ul>

    <hr />

    <p class="muted">
      Built by Felipe Icaza • Silent Sentry is a personal ops tool designed for
      clarity, reliability, and low overhead.
    </p>
  </body>
</html>
