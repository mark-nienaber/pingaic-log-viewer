# PingAIC Log Viewer

A web-based log viewer for PingOne Advanced Identity Cloud (AIC) with live tailing, historical search, unified AM/IDM views, and intelligent noise filtering.

## Quick Start

```bash
git clone <repo-url>
cd pingaic-log-viewer
npm install
cp .env.example .env    # Edit with your tenant credentials
npm start
```

Open `http://localhost:3000` in your browser.

## Features

- **Live log tailing** with WebSocket streaming
- **Unified AM + IDM** log view (not separated like CLI tools)
- **Intelligent noise reduction** with pre-configured filter lists (140+ noisy loggers)
- **Historical log search** with time range queries and pagination
- **Filter by** source, level, transaction ID, logger, free text
- **Expandable log rows** with full JSON payload and syntax highlighting
- **Export logs** in JSON, Human-Readable Text, or CSV format
- **Rate limit aware** polling with live status display
- **Dark theme** dashboard with responsive design
- **Auto-scroll** with smart pause/resume
- **Transaction ID linking** - click any txnId to filter

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3000` |
| `TENANT_URL` | PingAIC tenant URL | |
| `API_KEY_ID` | Monitoring API key | |
| `API_KEY_SECRET` | Monitoring API secret | |
| `POLL_FREQUENCY` | Seconds between tail polls | `10` |
| `MAX_LOG_BUFFER` | Max logs held in browser memory | `5000` |

### API Key Setup

Navigate to your PingAIC tenant > Tenant Settings > Log API Keys to create a key/secret pair for the monitoring API.

## Log Sources

| Source | Description |
|--------|-------------|
| `am-everything` | All AM logs combined |
| `am-authentication` | Authentication events |
| `am-access` | Access audit logs |
| `am-core` | Core debug logs |
| `idm-everything` | All IDM logs combined |
| `idm-sync` | Synchronization operations |
| `idm-activity` | Identity object changes |
| `idm-access` | Access events |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+H` | Toggle historical search panel |

## Architecture

- **Backend:** Express.js + WebSocket (ws) + dotenv
- **Frontend:** Tailwind CSS + Alpine.js (both via CDN - no build step)
- **Dependencies:** 3 production packages only

Based on patterns from [fidc-debug-tools](https://github.com/vscheuber/fidc-debug-tools).

## License

MIT
