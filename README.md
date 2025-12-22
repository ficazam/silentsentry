# Silent Sentry 🛡️

_A lightweight monitoring daemon that periodically checks your apps, writes state to Firestore, and sends Discord alerts + daily summaries._

**Stack:** NestJS • @nestjs/schedule • Firestore • Discord Webhooks • TypeScript

**Design goal: signal > noise**  
One DOWN alert per target per day, immediate RECOVERED alerts, and a daily summary — without DB bloat.

---

## Why this exists

Most personal monitoring setups either spam you, cost money over time, or depend on dashboards you don’t control. Silent Sentry is intentionally opinionated:

- ✅ One DOWN alert per target per day (timezone-aware)
- ✅ Immediate RECOVERED alert when service returns
- ✅ Daily summary of all monitored targets
- ✅ Rolling retention: keep only today + yesterday logs
- ✅ Built to run as a single instance to avoid duplicate cron execution

---

## Core features

### Monitoring

- HTTP checks for frontends (static sites) and backends (APIs)
- Per-target configuration:
  - intervalSeconds
  - expectedStatus
  - timeoutMs
  - bodyContains (optional)
  - latencyDegradedMs (optional)

### Alerting

- Discord webhook notifications
- Daily summary sent at a fixed local time (e.g., 09:00 Panama)

### Persistence

- targets: what to monitor
- targetStates: last known status + suppression metadata
- checkResults: rolling logs for debugging + summaries

---

## Alert policy (Signal > Noise)

The whole point is to stop alert fatigue. Per target, per day (in your configured timezone):

- **UP → DOWN**: send 🔴 once, suppress additional DOWN alerts until tomorrow
- **DOWN → UP**: send 🟢 immediately (always), then stay quiet
- **No “still down” spam**: silence until recovery or the next day

---

## Architecture

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
             └────────────────────────▶ Discord Notifier

---

## Getting started (Local)

### Prerequisites

- Node.js >= 20
- Firebase project with Firestore enabled
- Discord webhook URL

### Install

    npm ci

### Environment variables

Create a .env file:

    DISCORD_WEBHOOK_URL=<discord webhook>
    ADMIN_API_KEY=dev-secret

    SENTRY_TIMEZONE=America/Panama
    SENTRY_MAX_CONCURRENCY=1

    FIREBASE_SERVICE_ACCOUNT_PATH=./firebase.json

### Run

    npm run start:dev

---

## Admin API

All admin routes require the header:

    x-admin-key: <ADMIN_API_KEY>

### Create a target

POST /admin/targets

Frontend example:

    {
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
    }

Backend example:

    {
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
    }

---

## Deployment (Render)

Run exactly one instance in production.

Build command:

    npm ci && npm run build

Start command:

    node dist/main.js

---

_Built by Felipe Icaza • Silent Sentry_
