# PingAIC Log Viewer

A web-based log viewer for PingOne Advanced Identity Cloud (AIC) with live tailing, historical search, unified AM/IDM views, and intelligent noise filtering.

![Node.js](https://img.shields.io/badge/Node.js-18%2B-green)
![Express](https://img.shields.io/badge/Express-4.x-lightgrey)
![License](https://img.shields.io/badge/License-MIT-blue)

## Overview

PingAIC Log Viewer provides a browser-based dashboard for monitoring and searching PingOne Advanced Identity Cloud logs. Unlike CLI-based tools that separate AM and IDM log streams, this tool presents a unified, filterable view of all log sources in a single interface.

Key capabilities:
- **Real-time log streaming** via WebSocket with configurable poll frequency
- **Unified AM + IDM view** — see all logs interleaved by timestamp
- **140+ noise filters** — suppress known noisy loggers with one toggle
- **Historical search** — query logs by time range with pagination
- **Export** — download logs as JSON, human-readable text, or CSV

## Prerequisites

Before you begin, ensure you have the following:

### 1. Node.js (v18 or higher)

Check your version:

```bash
node --version   # Should be v18.x or higher
npm --version    # Comes bundled with Node.js
```

If you need to install Node.js, download it from [nodejs.org](https://nodejs.org/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm):

```bash
# Using nvm (macOS/Linux)
nvm install 18
nvm use 18
```

### 2. PingOne Advanced Identity Cloud Tenant Access

You need access to a PingOne AIC tenant with permission to create monitoring API keys.

### 3. Log API Key and Secret

You must create a Log API key/secret pair in your PingAIC tenant:

1. Log in to your PingOne AIC admin console
2. Navigate to **Tenant Settings** > **Log API Keys**
3. Click **New Log API Key**
4. Copy both the **Key ID** and **Secret** — the secret is only shown once

> **Note:** The Log API provides read-only access to audit and debug logs. It does not grant access to modify tenant configuration.

## Installation

### 1. Clone the Repository

```bash
git clone https://github.com/mark-nienaber/pingaic-log-viewer.git
cd pingaic-log-viewer
```

### 2. Install Dependencies

```bash
npm install
```

This installs only 3 production dependencies:
- `express` — HTTP server and static file serving
- `ws` — WebSocket support for real-time streaming
- `dotenv` — Environment variable loading

### 3. Configure Environment (Optional)

```bash
cp .env.example .env
```

> **Note:** The `.env` file is optional. You can enter all connection details directly in the browser UI instead. See [Connecting to Your Tenant](#connecting-to-your-tenant) below.

If you prefer to pre-configure credentials, edit `.env` with your values:

```env
PORT=3000
TENANT_URL=https://your-tenant.forgeblocks.com
API_KEY_ID=your-api-key-id
API_KEY_SECRET=your-api-key-secret
POLL_FREQUENCY=10
MAX_LOG_BUFFER=5000
```

## Running the Application

### Standard Mode

```bash
npm start
```

### Stop the Server

```bash
npm stop
```

### Development Mode (auto-restart on file changes)

```bash
npm run dev
```

Once started, you will see:

```
PingAIC Log Viewer running at http://localhost:3000
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Connecting to Your Tenant

There are two ways to provide your tenant credentials:

### Option 1: Enter Credentials in the UI

1. Open [http://localhost:3000](http://localhost:3000)
2. Enter your **Tenant URL**, **API Key**, and **API Secret** directly in the connection form
3. Optionally check **Remember connection** to save credentials in your browser's local storage so they persist across sessions
4. Click **Connect**

### Option 2: Pre-configure via `.env` File

1. Copy `.env.example` to `.env` and fill in your credentials (see [Configure Environment](#3-configure-environment-optional))
2. Start the server — the connection form will be pre-filled with your `.env` values
3. Click **Connect**

> **Tip:** You can mix both approaches — pre-fill defaults in `.env` and override them in the UI as needed.

Once connected, live log tailing begins automatically.

## Usage Guide

### Live Log Tailing

- Logs stream in real-time from your tenant via WebSocket
- By default, both AM and IDM logs are shown in a unified view
- Logs are color-coded by source: **amber** for AM, **cyan** for IDM
- Log levels are color-coded: **red** = ERROR, **yellow** = WARNING, **blue** = INFO, **gray** = DEBUG
- Click any log row to expand it and see the full JSON payload with syntax highlighting
- Auto-scroll keeps you at the bottom; scroll up to pause, then click **Resume auto-scroll** to return

### Filtering

Use the filter bar to narrow down logs:

| Filter | Description |
|--------|-------------|
| **Sources** | Select which log sources to include (AM, IDM, or specific sub-sources) |
| **Level** | Filter by log level (ERROR, WARNING, INFO, DEBUG) |
| **Search** | Free-text search across log messages |
| **Transaction ID** | Filter by a specific transaction ID — click any txnId in the log to auto-filter |
| **Noise Filter** | Toggle to hide 140+ known noisy loggers (enabled by default) |
| **Category Presets** | Quick-select loggers by category: Authentication, Federation, OAuth, Scripting, Policy, Session |

### Historical Search

Press **Ctrl+H** or click the clock icon to open the historical search panel:

1. Select a quick time range (Last 15 min, 1 hour, 6 hours, 24 hours) or set custom start/end times
2. Optionally filter by Transaction ID or add a custom query filter
3. Click **Search** to fetch results
4. Use **Load More** for paginated results (the API returns up to 1000 logs per page)
5. Click **Resume Tailing** to switch back to live mode

> **Note:** The PingAIC API limits historical queries to 24-hour windows. For longer ranges, the tool automatically splits the request into sequential 24-hour chunks.

### Exporting Logs

Click the export icon in the toolbar to download logs:

| Format | Description |
|--------|-------------|
| **JSON** | Pretty-printed JSON array of all log entries |
| **Text** | Human-readable formatted text with timestamps, sources, levels, and messages |
| **CSV** | Comma-separated values with columns: timestamp, source, level, logger, transactionId, message |

You can export either all logs in the buffer or only the currently filtered/visible logs.

### Settings

Click the gear icon to access settings:

| Setting | Description | Default |
|---------|-------------|---------|
| **Poll Frequency** | Seconds between API polls (2–60) | 10 |
| **Max Buffer Size** | Maximum logs held in browser memory (500–50,000) | 5000 |
| **Auto-scroll** | Automatically scroll to newest logs | On |

## Configuration Reference

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server listen port | `3000` |
| `TENANT_URL` | Full URL of your PingAIC tenant (e.g., `https://tenant.forgeblocks.com`) | — |
| `API_KEY_ID` | Log API key ID from tenant settings | — |
| `API_KEY_SECRET` | Log API secret from tenant settings | — |
| `POLL_FREQUENCY` | Default seconds between tail polls | `10` |
| `MAX_LOG_BUFFER` | Default max logs in browser memory | `5000` |

### Available Log Sources

| Source | Description |
|--------|-------------|
| `am-everything` | All AM logs combined |
| `am-authentication` | Authentication events |
| `am-access` | Access audit logs |
| `am-core` | Core AM debug logs |
| `am-config` | Configuration change logs |
| `idm-everything` | All IDM logs combined |
| `idm-sync` | Synchronization operations |
| `idm-activity` | Identity object changes |
| `idm-access` | IDM access events |
| `idm-core` | Core IDM debug logs |

## Architecture

```
pingaic-log-viewer/
├── server.js                 # Express + WebSocket entry point
├── package.json
├── .env.example              # Configuration template
├── .env                      # Your config (gitignored)
├── src/
│   ├── api/
│   │   ├── logClient.js      # PingAIC HTTP client (tail + query)
│   │   └── rateLimiter.js    # Rate limit tracking (X-RateLimit headers)
│   ├── ws/
│   │   └── tailManager.js    # Per-client WebSocket polling manager
│   ├── routes/
│   │   ├── connection.js     # POST /api/connect
│   │   └── logs.js           # Search, config, sources, categories endpoints
│   └── data/
│       ├── categories.json   # Noise filters + logger category definitions
│       └── sources.json      # Log source metadata
└── public/
    ├── index.html            # Single-page application
    ├── css/app.css           # Custom styles
    └── js/
        ├── app.js            # Alpine.js store + WebSocket client
        └── utils/
            ├── formatter.js  # Log formatting + JSON highlighting
            └── timeUtils.js  # Date/time utilities
```

- **Backend:** Node.js with Express for HTTP + ws library for WebSocket streaming
- **Frontend:** Tailwind CSS + Alpine.js loaded via CDN — no build step required
- **API Integration:** Uses the [PingOne AIC Monitoring API](https://docs.pingidentity.com/pingoneaic/tenants/audit-debug-logs-pull.html) with rate limit awareness (60 requests/minute)
- **Only 3 production dependencies** — lightweight and easy to audit

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+H` | Toggle historical search panel |
| `Escape` | Close any open panel or modal |

## Troubleshooting

### Port already in use

If you see `EADDRINUSE: address already in use :::3000`:

```bash
# Find and kill the process using port 3000
lsof -ti:3000 | xargs kill -9

# Or use a different port
PORT=3001 npm start
```

### Connection fails

- Verify your tenant URL includes `https://` and does not have a trailing slash
- Confirm your API Key ID and Secret are correct (secrets cannot be retrieved after creation — generate a new one if lost)
- Ensure your network can reach the tenant (check firewalls, VPN, proxies)

### No logs appearing

- Ensure there is activity on your tenant generating logs
- Check that the selected log sources are correct
- Disable the noise filter to see if logs are being filtered out
- Check the rate limit indicator in the status bar — if at 0 remaining, wait for the reset

### Rate limiting

The PingAIC API allows 60 requests per minute. The status bar shows current usage. If you hit the limit, the tool automatically backs off and resumes when the limit resets.

## License

MIT
